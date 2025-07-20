import { format, subDays } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type CalendarDateRangePickerProps = {
  className?: string
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}

export const CalendarDateRangePicker = React.memo(
  ({ className, value, onChange }: CalendarDateRangePickerProps) => {
    return (
      <div className={cn('gap-2 grid', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'justify-start max-w-[260px] font-normal text-left',
                !value && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 w-4 h-4" />
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'LLL dd, y')} -{' '}
                    {format(value.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(value.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-auto translate-x-2 md:translate-x-0"
            align="end"
          >
            <Select
              onValueChange={(preset) => {
                let newRange: DateRange | undefined
                const today = new Date()
                switch (preset) {
                  case 'today':
                    newRange = { from: today, to: today }
                    break
                  case 'yesterday':
                    newRange = {
                      from: subDays(today, 1),
                      to: subDays(today, 1),
                    }
                    break
                  case 'last7':
                    newRange = { from: subDays(today, 6), to: today }
                    break
                  case 'thisMonth':
                    newRange = {
                      from: new Date(today.getFullYear(), today.getMonth(), 1),
                      to: today,
                    }
                    break
                  case 'lastMonth':
                    const lastMonth = new Date(
                      today.getFullYear(),
                      today.getMonth() - 1,
                      1,
                    )
                    newRange = {
                      from: lastMonth,
                      to: new Date(today.getFullYear(), today.getMonth(), 0),
                    }
                    break
                  default:
                    newRange = { from: today, to: today }
                }
                onChange(newRange)
              }}
            >
              <SelectTrigger className="mt-2 ml-2">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
              </SelectContent>
            </Select>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              disabled={{ before: new Date('2025-06-01'), after: new Date() }}
              fromMonth={new Date('2025-06-01')}
              toMonth={new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)
