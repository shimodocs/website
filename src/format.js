// Dates are formatted without Intl so the prerendered output cannot vary with
// the build runner's locale or ICU version.
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function formatMonthYear(iso) {
  if (!iso) return ''
  const [year, month] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${year}`
}
