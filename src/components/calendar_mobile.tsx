import { Button } from '@/components/ui/button'
import { DatePickerWithPresets as DatePicker } from '@/components/ui/datepicker'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  enterCalendarEvent,
  getCalendarEventDocument,
} from '@/firebase/firestore'
import { useLoadingSpinner } from '@/lib/utils'
import type { EventApi } from '@fullcalendar/core/index.js'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import FloatingActionMenu from './ui/floating-action-menu'
import { setHours, setMinutes, setSeconds } from 'date-fns'

export type calendarEventProps = {
  id: string
  title: string
  start: string
  end: string
  color: string
  startTime?: string
  endTime?: string
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  let result = setHours(date, hours)
  result = setMinutes(result, minutes)
  result = setSeconds(result, 0)
  return result
}

export function Calendar() {
  const [localEvents, setLocalEvents] = useState<calendarEventProps[]>([])

  const {
    data: calendarEvents,
    isLoading,
    error,
  } = useQuery<calendarEventProps[]>({
    queryKey: ['calendarEvents'],
    queryFn: getCalendarEventDocument,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    setLocalEvents(calendarEvents || [])
  }, [calendarEvents])

  useLoadingSpinner(isLoading)

  const queryClient = useQueryClient()

  const enterCalendarEventMutation = useMutation({
    mutationFn: enterCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      toast('Calendar event entered successfully!')
    },
    onError: (error: any) => {
      toast('error!', error)
    },
  })

  const [title, setTitle] = useState('')
  const [start, setStart] = useState<Date>()
  const [end, setEnd] = useState<Date>()
  const [color, setColor] = useState('#e11d48')
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null)
  const [detailsDrawer, setDetailsDrawer] = useState(false)

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!title) {
      alert('Title is required')
      return
    }
    if (!start || !end) {
      alert('Both start and end dates are required')
      return
    }

    const startDateTime =
      startTime && start ? combineDateAndTime(start, startTime) : start
    const endDateTime = endTime && end ? combineDateAndTime(end, endTime) : end

    if (startDateTime > endDateTime) {
      alert('End date and time must be after start date and time')
      return
    }

    setLocalEvents((prevEvents) => [
      ...prevEvents,
      {
        id: (prevEvents.length + 1).toString(),
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        color,
      },
    ])

    setTitle('')
    setStart(undefined)
    setEnd(undefined)
    setStartTime('')
    setEndTime('')
    setColor('#e11d48')
    // Close the Drawer here
    setOpen(false)
  }

  const calendarRef = useRef<any>(null)

  const handleNext = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.next()
  }

  const handleToday = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.today()
  }

  const handlePrev = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.prev()
  }

  const handleDayView = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.changeView('timeGridDay')
  }

  const handleMonthView = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.changeView('dayGridMonth')
  }

  return (
    <div className="flex flex-col p-4 w-full h-full">
      {/* <h2 className="first:mt-0 mb-2 pb-2 border-b font-semibold text-3xl text-center tracking-tight scroll-m-20">
        Scheduler
      </h2> */}

      <div className="flex justify-between py-2">
        <div className="inline-flex -space-x-px bg-background shadow-sm rounded-md overflow-hidden">
          <Drawer
            shouldScaleBackground={true}
            setBackgroundColorOnScale={true}
            open={open}
            onOpenChange={setOpen}
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add Event</DrawerTitle>
                <DrawerDescription>
                  Add a new event to the calendar. Click save when you're done.
                </DrawerDescription>
              </DrawerHeader>
              <form onSubmit={handleSubmit} className="gap-4 grid py-4">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="start" className="text-right">
                    Start
                  </Label>

                  <DatePicker selected={start} onSelect={setStart} />
                </div>
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="startTime" className="text-right">
                    Start Time
                  </Label>

                  <Input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  ></Input>
                </div>
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="end" className="text-right">
                    End
                  </Label>
                  <DatePicker selected={end} onSelect={setEnd} />
                </div>
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="endTime" className="text-right">
                    End Time
                  </Label>

                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  ></Input>
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>

                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <DrawerFooter>
                  <Button type="submit">Save changes</Button>
                  <DrawerClose asChild>
                    <Button variant={'outline'}>Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>

          <FloatingActionMenu
            className="right-4 bottom-4 z-50 absolute"
            options={[
              {
                label: 'Add Event',
                Icon: <Plus className="w-4 h-4" />,
                onClick: () => setOpen(true),
              },
              {
                label: 'Month View',
                Icon: <CalendarDays className="w-4 h-4" />,
                onClick: handleMonthView,
              },
              {
                label: 'Day View',
                Icon: <CalendarClock className="w-4 h-4" />,
                onClick: handleDayView,
              },
              {
                label: 'Save',
                Icon: <Save className="w-4 h-4" />,
                onClick: () => enterCalendarEventMutation.mutate(localEvents),
              },
            ]}
          />
        </div>

        <span className="inline-flex -space-x-px bg-background shadow-sm border rounded-md overflow-hidden">
          <Button
            variant="outline"
            onClick={handlePrev}
            className="inline-block focus:relative hover:bg-gray-50 px-4 py-2 border-0 rounded-tr-none rounded-br-none font-medium text-gray-700 text-sm"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            onClick={handleToday}
            className="gap-1 border-0 rounded-none"
          >
            <RotateCcw size={20} />
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            className="inline-block focus:relative hover:bg-gray-50 px-4 py-2 border-0 rounded-tl-none rounded-bl-none font-medium text-gray-700 text-sm"
          >
            <ChevronRight />
          </Button>
        </span>
      </div>

      <div className="flex flex-col h-full">
        {error && (
          <div
            className="relative bg-red-100 mx-auto px-2 py-1 border border-red-400 rounded max-w-xs text-red-700 text-sm"
            role="alert"
          >
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error.message}</span>
          </div>
        )}

        <div className="h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            events={localEvents}
            // displayEventTime={false}
            headerToolbar={{
              left: 'title',
              center: '',
              right: '',
            }}
            height={'100%'}
            contentHeight={'100%'}
            eventClick={(info) => {
              setSelectedEvent(info.event)
              setDetailsDrawer(true)
            }}
          />
        </div>
      </div>

      <Drawer
        shouldScaleBackground={true}
        setBackgroundColorOnScale={true}
        open={detailsDrawer}
        onOpenChange={setDetailsDrawer}
      >
        {selectedEvent && (
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Event Details</DrawerTitle>
              <DrawerDescription>View event details here.</DrawerDescription>
            </DrawerHeader>
            <ul className="my-6 [&>li]:mt-2 ml-6 marker:text-primary list-disc">
              <li>Title: {selectedEvent.title}</li>
              <li>
                Start Date:{' '}
                {selectedEvent.start &&
                  new Date(selectedEvent.start).toLocaleDateString()}
              </li>
              <li>
                End Date:{' '}
                {selectedEvent.end &&
                  new Date(selectedEvent.end).toLocaleDateString()}
              </li>
            </ul>
            <DrawerFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailsDrawer(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const calendarApi = calendarRef.current.getApi()
                  calendarApi.getEventById(selectedEvent.id).remove()
                  // console.log("prev event", localEvents);
                  // console.log("selected event", selectedEvent.id);
                  setLocalEvents((localEvents) =>
                    localEvents.filter(
                      (localEvents) => localEvents.id !== selectedEvent.id,
                    ),
                  )
                  // console.log("event", localEvents);

                  setDetailsDrawer(false)
                }}
              >
                Delete Event
              </Button>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </div>
  )
}
