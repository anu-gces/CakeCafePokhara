import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { endOfDay } from 'date-fns/endOfDay'
import { startOfDay } from 'date-fns/startOfDay'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toUTCDateRange(date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
