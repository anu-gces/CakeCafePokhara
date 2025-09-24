import { addDays, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'

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

interface DatePickerWithPresetsProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
}

export function DatePickerWithPresets({
  selected,
  onSelect,
}: DatePickerWithPresetsProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(selected)
  }, [selected])

  const handleSelect = (date: Date | undefined) => {
    setDate(date)
    onSelect(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'justify-start w-[280px] font-normal text-left',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 w-4 h-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col space-y-2 p-2 w-auto">
        <Select
          onValueChange={(value) =>
            handleSelect(addDays(new Date(), Number.parseInt(value)))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="-1">Yesterday</SelectItem>
            <SelectItem value="-3">3 days ago</SelectItem>
            <SelectItem value="-7">1 week ago</SelectItem>
            <SelectItem value="-30">1 month ago</SelectItem>
          </SelectContent>
        </Select>
        <div className="border rounded-md">
          <Calendar mode="single" selected={date} onSelect={handleSelect} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
