import { eachDayOfInterval, format, getDate, parseISO } from 'date-fns'

export function generateReceiptId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[array[i] % chars.length]
  }
  return `CAKE-${result}`
}

export function getWeeklyDocId(date: Date = new Date()): string {
  const week = Math.floor((getDate(date) - 1) / 7) + 1
  return `${format(date, 'yyyy-MM')}-Week${String(week).padStart(2, '0')}`
}

export function getWeeklyDocIdsInRange(from: string, to: string): string[] {
  const days = eachDayOfInterval({
    start: parseISO(from),
    end: parseISO(to),
  })

  const uniqueWeekIds = new Set(days.map(getWeeklyDocId))
  return Array.from(uniqueWeekIds)
}
