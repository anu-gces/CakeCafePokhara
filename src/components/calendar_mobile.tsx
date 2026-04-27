import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { SplashScreen } from './splashscreen'
import { pb } from '@/lib/pocketbase'
import { handlePbError } from '@/lib/utils'
import { Switch } from './ui/switch'

export type CalendarEventProps = {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
}

export function Calendar() {
  const queryClient = useQueryClient()

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<CalendarEventProps[]>({
    queryKey: ['calendarEvents'],
    queryFn: () => pb.collection('calendarEvents').getFullList(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const addEventMutation = useMutation({
    mutationFn: (event: Omit<CalendarEventProps, 'id'>) =>
      pb.collection('calendarEvents').create(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      toast('Event added!')
    },
    onError: handlePbError,
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => pb.collection('calendarEvents').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      toast('Event deleted!')
    },
    onError: handlePbError,
  })

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('#e11d48')
  const [open, setOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null)
  const [detailsDrawer, setDetailsDrawer] = useState(false)
  const [isDayView, setIsDayView] = useState(false)
  const calendarRef = useRef<any>(null)

  const handleNext = () => calendarRef.current.getApi().next()
  const handleToday = () => calendarRef.current.getApi().today()
  const handlePrev = () => calendarRef.current.getApi().prev()

  const handleDayView = () =>
    calendarRef.current.getApi().changeView('timeGridDay')

  const handleMonthView = () =>
    calendarRef.current.getApi().changeView('dayGridMonth')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date')
      return
    }

    addEventMutation.mutate({
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      color,
    })

    setTitle('')
    setStartDate('')
    setEndDate('')
    setColor('#e11d48')
    setOpen(false)
  }

  return (
    <div className="flex flex-col p-4 w-full h-full">
      {/* TOP BAR */}
      <div className="flex justify-between items-center py-2">
        {/* LEFT CONTROLS */}
        <div className="flex items-center gap-2">
          {/* Drawer Trigger */}
          <Drawer
            shouldScaleBackground={false}
            setBackgroundColorOnScale={false}
            open={open}
            onOpenChange={setOpen}
          >
            <DrawerTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus color="white" className="w-4 h-4" />
                Add Event
              </Button>
            </DrawerTrigger>

            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add Event</DrawerTitle>
                <DrawerDescription>
                  Create a new calendar event.
                </DrawerDescription>
              </DrawerHeader>

              <form onSubmit={handleSubmit} className="gap-4 grid py-4">
                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">Start</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">End</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">Color</Label>
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <DrawerFooter>
                  <Button type="submit" disabled={addEventMutation.isPending}>
                    {addEventMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>

          {/* VIEW TOGGLE */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />

            <Switch
              checked={isDayView}
              onCheckedChange={(checked) => {
                setIsDayView(checked)

                if (checked) {
                  handleDayView()
                } else {
                  handleMonthView()
                }
              }}
            />

            <CalendarClock className="w-4 h-4" />
          </div>
        </div>

        {/* NAV BUTTONS */}
        <span className="inline-flex -space-x-px bg-background shadow-sm border rounded-md overflow-hidden">
          <Button variant="outline" onClick={handlePrev}>
            <ChevronLeft />
          </Button>

          <Button variant="outline" onClick={handleToday}>
            <RotateCcw size={20} />
          </Button>

          <Button variant="outline" onClick={handleNext}>
            <ChevronRight />
          </Button>
        </span>
      </div>

      {/* CALENDAR */}
      <div className="flex flex-col h-full">
        {error && (
          <div className="bg-red-100 px-2 py-1 border border-red-400 rounded text-red-700 text-sm">
            {error.message}
          </div>
        )}

        {isLoading && <SplashScreen />}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.startDate,
            end: e.endDate,
            color: e.color,
          }))}
          headerToolbar={{ left: 'title', center: '', right: '' }}
          height="100%"
          eventClick={(info) => {
            setSelectedEvent(info.event)
            setDetailsDrawer(true)
          }}
        />
      </div>

      {/* DETAILS DRAWER */}
      <Drawer
        shouldScaleBackground={false}
        setBackgroundColorOnScale={false}
        open={detailsDrawer}
        onOpenChange={setDetailsDrawer}
      >
        {selectedEvent && (
          <DrawerContent>
            <DrawerHeader className="pb-0">
              <p className="text-muted-foreground text-xs">Event details</p>
              <DrawerTitle className="text-xl">
                {selectedEvent.title}
              </DrawerTitle>
            </DrawerHeader>

            <div className="px-4 py-5">
              <div className="flex items-stretch gap-4">
                {/* timeline spine */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="rounded-full w-2 h-2 shrink-0"
                    style={{ background: selectedEvent.backgroundColor }}
                  />
                  <div className="flex-1 my-1.5 bg-border w-px" />
                  <div className="border-2 border-border rounded-full w-2 h-2 shrink-0" />
                </div>

                {/* content */}
                <div className="flex flex-col flex-1 gap-5">
                  <div>
                    <p className="mb-0.5 text-[11px] text-muted-foreground uppercase tracking-widest">
                      Start
                    </p>
                    <p className="font-medium text-sm">
                      {selectedEvent.start?.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedEvent.start?.toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="mb-0.5 text-[11px] text-muted-foreground uppercase tracking-widest">
                      End
                      {selectedEvent.start &&
                        selectedEvent.end &&
                        (() => {
                          const mins = Math.round(
                            (selectedEvent.end.getTime() -
                              selectedEvent.start.getTime()) /
                              60000,
                          )
                          const h = Math.floor(mins / 60)
                          const m = mins % 60
                          const label =
                            h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`
                          return (
                            <span className="ml-1 normal-case">· {label}</span>
                          )
                        })()}
                    </p>
                    <p className="font-medium text-sm">
                      {selectedEvent.end?.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedEvent.end?.toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DrawerFooter className="flex gap-2">
              <Button
                className="flex-1 bg-primary"
                disabled={deleteEventMutation.isPending}
                onClick={() => {
                  deleteEventMutation.mutate(selectedEvent.id)
                  setDetailsDrawer(false)
                }}
              >
                {deleteEventMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDetailsDrawer(false)}
              >
                Close
              </Button>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </div>
  )
}
