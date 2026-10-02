import styles from './ReportDownloadButton.module.scss'

interface ReportDownloadButtonProps {
  isDownloading: boolean
  disabled?: boolean
  onClick: () => void
}

export function ReportDownloadButton({
  isDownloading,
  disabled = false,
  onClick,
}: ReportDownloadButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={disabled || isDownloading}
    >
      {isDownloading ? 'Generando informe…' : '⬇ Descargar informe PDF'}
    </button>
  )
}
