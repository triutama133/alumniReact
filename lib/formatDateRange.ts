const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const

export type ActivityDateRange = {
  start_month?: number | null
  start_year?: number | null
  is_current?: boolean | null
  end_month?: number | null
  end_year?: number | null
}

function monthLabel(month?: number | null, short = true): string {
  if (!month || month < 1 || month > 12) return ''
  const name = MONTH_NAMES_ID[month - 1]
  return short ? name.slice(0, 3) : name
}

/** "Jan 2022 – Sekarang" / "Mar 2019 – Agu 2021" / "" if no start date set yet. */
export function formatDateRange(entry: ActivityDateRange): string {
  if (!entry.start_year) return ''
  const start = `${monthLabel(entry.start_month)} ${entry.start_year}`.trim()

  if (entry.is_current || !entry.end_year) {
    return entry.is_current ? `${start} – Sekarang` : start
  }

  const end = `${monthLabel(entry.end_month)} ${entry.end_year}`.trim()
  return `${start} – ${end}`
}

/** Months between "now" and the entry's end date. Returns null if still ongoing or no end date. */
function monthsSinceEnded(entry: ActivityDateRange): number | null {
  if (entry.is_current || !entry.end_year) return null
  const now = new Date()
  const endMonthIndex = (entry.end_month || 1) - 1
  const endDate = new Date(entry.end_year, endMonthIndex, 1)
  return (now.getFullYear() - endDate.getFullYear()) * 12 + (now.getMonth() - endDate.getMonth())
}

/** Derives the old-style human status label from real dates, for display/back-compat (aktivitas_status_durasi). */
export function computeActivityStatusLabel(entry: ActivityDateRange): string {
  const diff = monthsSinceEnded(entry)
  if (diff === null) return 'Aktif saat ini'
  if (diff < 12) return '<1 tahun lalu'
  if (diff < 36) return '1-3 tahun lalu'
  if (diff < 60) return '3-5 tahun lalu'
  return '>5 tahun'
}

/** Whether this activity entry ended more than 5 years ago — replaces the old manual ">5 tahun" status pick. */
export function isOlderThanFiveYears(entry: ActivityDateRange): boolean {
  const diff = monthsSinceEnded(entry)
  return diff !== null && diff >= 60
}
