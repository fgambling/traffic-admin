/**
 * Format a date/datetime string or Date object to "yyyy-MM-dd HH:mm:ss"
 * Handles the ISO 8601 "T" separator from backend LocalDateTime serialization.
 */
export function fmtDate(val) {
  if (!val) return '--'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
