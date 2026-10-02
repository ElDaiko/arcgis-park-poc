/** Mensaje legible de un error desconocido (rechazos de promesas, etc.). */
export function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}
