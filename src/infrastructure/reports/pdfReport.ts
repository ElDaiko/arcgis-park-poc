import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import type { DensityReportData } from './densityReportData'
import type { WebMapReportData } from './webMapReportData'

// Paleta del design system (magenta/verde de la marca).
const BRAND_MAGENTA: [number, number, number] = [219, 0, 97]
const BRAND_GREEN: [number, number, number] = [0, 132, 68]
const INK: [number, number, number] = [27, 28, 28]
const MUTED: [number, number, number] = [110, 110, 110]

const PAGE_MARGIN = 40

function formatInt(n: number): string {
  return Math.round(n).toLocaleString('es-CO')
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)} %`
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

/** Dibuja el encabezado de marca y devuelve la Y donde continuar. */
function drawHeader(doc: jsPDF, title: string, subtitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...BRAND_MAGENTA)
  doc.rect(0, 0, pageWidth, 8, 'F')

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(title, PAGE_MARGIN, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  doc.text(subtitle, PAGE_MARGIN, 66)

  doc.setDrawColor(...BRAND_GREEN)
  doc.setLineWidth(1)
  doc.line(PAGE_MARGIN, 78, pageWidth - PAGE_MARGIN, 78)

  return 96
}

/** Inserta la captura del mapa manteniendo proporción. Devuelve la Y siguiente. */
function drawMapImage(doc: jsPDF, dataUrl: string, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - PAGE_MARGIN * 2

  const props = doc.getImageProperties(dataUrl)
  const ratio = props.height / props.width
  const imgWidth = usableWidth
  const imgHeight = Math.min(usableWidth * ratio, 280)

  doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, startY, imgWidth, imgHeight)
  return startY + imgHeight + 20
}

/** Dibuja una fila de tarjetas KPI. Devuelve la Y siguiente. */
function drawKpis(
  doc: jsPDF,
  startY: number,
  kpis: { label: string; value: string }[],
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - PAGE_MARGIN * 2
  const gap = 10
  const cardWidth = (usableWidth - gap * (kpis.length - 1)) / kpis.length
  const cardHeight = 52

  kpis.forEach((kpi, i) => {
    const x = PAGE_MARGIN + i * (cardWidth + gap)
    doc.setFillColor(247, 247, 249)
    doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'F')

    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(kpi.label.toUpperCase(), x + 10, startY + 18)

    doc.setTextColor(...BRAND_MAGENTA)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.text(kpi.value, x + 10, startY + 40)
  })

  return startY + cardHeight + 20
}

function drawFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(
    'Parque Recreativo Comfama Tutucán · Informe generado automáticamente',
    PAGE_MARGIN,
    pageHeight - 20,
  )
  doc.text(
    formatDateTime(new Date()),
    pageWidth - PAGE_MARGIN,
    pageHeight - 20,
    { align: 'right' },
  )
}

/**
 * Genera y descarga el informe PDF del Análisis de Densidad.
 */
export function generateDensityReport(
  data: DensityReportData,
  mapImageDataUrl: string | null,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  let y = drawHeader(
    doc,
    'Informe de Análisis de Densidad',
    `Generado el ${formatDateTime(new Date())}`,
  )

  y = drawKpis(doc, y, [
    { label: 'Aforo actual', value: formatInt(data.totalAforo) },
    { label: 'Capacidad', value: formatInt(data.totalCapacity) },
    { label: 'Ocupación', value: formatPercent(data.occupancyPercent) },
    { label: 'Celdas', value: formatInt(data.totalCells) },
  ])

  if (mapImageDataUrl) {
    y = drawMapImage(doc, mapImageDataUrl, y)
  }

  autoTable(doc, {
    startY: y,
    head: [['Zona', 'Celdas', 'Aforo', 'Capacidad', 'Ocupación']],
    body: data.zones.map((z) => [
      z.zone,
      formatInt(z.cells),
      formatInt(z.aforo),
      formatInt(z.capacity),
      formatPercent(z.occupancyPercent),
    ]),
    theme: 'striped',
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: { fontSize: 9 },
    didDrawPage: () => drawFooter(doc),
  })

  const afterZones =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text('Celdas críticas (mayor índice de densidad)', PAGE_MARGIN, afterZones + 28)

  autoTable(doc, {
    startY: afterZones + 38,
    head: [['ID', 'Nombre', 'Zona', 'Aforo', 'Capacidad', 'Índice', 'Nivel']],
    body: data.criticalCells.map((c) => [
      c.id,
      c.nombre,
      c.zona,
      formatInt(c.aforo),
      formatInt(c.capacidad),
      c.indice.toFixed(2),
      formatInt(c.nivelUso),
    ]),
    theme: 'striped',
    headStyles: { fillColor: BRAND_MAGENTA, textColor: [255, 255, 255] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: { fontSize: 9 },
    didDrawPage: () => drawFooter(doc),
  })

  doc.save(`informe-densidad-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * Genera y descarga el informe PDF del Web Map (POIs, capas).
 */
export function generateWebMapReport(
  data: WebMapReportData,
  mapImageDataUrl: string | null,
  webMapItemId: string,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  let y = drawHeader(
    doc,
    'Informe del Mapa del Parque',
    `Web Map alojado en ArcGIS Online · ${webMapItemId}`,
  )

  y = drawKpis(doc, y, [
    { label: 'Puntos de interés', value: formatInt(data.poiCount) },
    { label: 'Senderos', value: formatInt(data.trailCount) },
    { label: 'Infraestructura', value: formatInt(data.infrastructureCount) },
  ])

  if (mapImageDataUrl) {
    y = drawMapImage(doc, mapImageDataUrl, y)
  }

  autoTable(doc, {
    startY: y,
    head: [['Categoría', 'Cantidad de POIs']],
    body: data.poisByCategory.map((c) => [c.label, formatInt(c.count)]),
    theme: 'striped',
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: { fontSize: 9 },
    didDrawPage: () => drawFooter(doc),
  })

  const afterCat =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  doc.text('Listado de puntos de interés', PAGE_MARGIN, afterCat + 28)

  autoTable(doc, {
    startY: afterCat + 38,
    head: [['Nombre', 'Categoría', 'Descripción']],
    body: data.pois.map((p) => [p.nombre, p.categoriaLabel, p.descripcion]),
    theme: 'striped',
    headStyles: { fillColor: BRAND_MAGENTA, textColor: [255, 255, 255] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 2: { cellWidth: 240 } },
    didDrawPage: () => drawFooter(doc),
  })

  doc.save(`informe-mapa-parque-${new Date().toISOString().slice(0, 10)}.pdf`)
}
