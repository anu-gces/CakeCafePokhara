import { type ClassValue, clsx } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { ClientResponseError } from 'pocketbase'
import { endOfDay } from 'date-fns/endOfDay'
import { startOfDay } from 'date-fns/startOfDay'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the error message string only
export function parsePbError(err: unknown): string {
  if (err instanceof ClientResponseError) {
    const fieldErrors = err.response?.data
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      return Object.entries(fieldErrors)
        .map(([field, error]: [string, any]) => `${field}: ${error.message}`)
        .join('\n')
    }
    if (err.response?.message) return err.response.message

    const statusMessages: Record<number, string> = {
      400: 'Invalid request.',
      401: 'You must be logged in.',
      403: "You don't have permission.",
      404: 'Not found.',
      429: 'Too many requests. Please slow down.',
      500: 'Server error. Try again later.',
    }
    return statusMessages[err.status] ?? 'Something went wrong.'
  }
  return 'An unexpected error occurred.'
}

// Generates a Toast
export function handlePbError(err: unknown) {
  toast.error(parsePbError(err))
}

export function toUTCDateRange(date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
