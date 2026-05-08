import { format, differenceInDays, isToday, isBefore, parseISO } from 'date-fns'

export function formatDate(date) {
  if (!date) return '—'
  return format(typeof date === 'string' ? parseISO(date) : date, 'd MMM yyyy')
}

export function daysOverdue(endDate) {
  if (!endDate) return 0
  const d = typeof endDate === 'string' ? parseISO(endDate) : endDate
  if (isBefore(d, new Date())) return differenceInDays(new Date(), d)
  return 0
}

export function escalationLevel(missCount) {
  if (missCount === 0) return null
  if (missCount === 1) return { level: 1, action: 'Send reminder', template: 'reminder' }
  if (missCount === 2) return { level: 2, action: 'Written confirmation required', template: 'confirmation' }
  if (missCount === 3) return { level: 3, action: 'Payment hold', template: 'payment_hold' }
  if (missCount === 4) return { level: 4, action: 'Find backup vendor', template: 'escalation' }
  return { level: 5, action: 'Replace vendor', template: 'escalation' }
}

export function missCountColor(count) {
  if (count === 0) return 'green'
  if (count <= 2) return 'amber'
  return 'red'
}