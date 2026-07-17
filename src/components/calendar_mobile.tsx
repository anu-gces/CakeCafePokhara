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
import { Switch } from './ui/switch'
import { SplashScreen } from './splashscreen'

import type { EventApi } from '@fullcalendar/core/index.js'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderIcon,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export function Calendar() {
  // 1. Convex Queries & Mutations
  const events = useQuery(api.calendar.calendar.listEvents)
  const createEvent = useMutation(api.calendar.calendar.createEvent)
  const deleteEvent = useMutation(api.calendar.calendar.deleteEvent)

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('#e11d48')
  const [open, setOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null)
  const [detailsDrawer, setDetailsDrawer] = useState(false)
  const [isDayView, setIsDayView] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const calendarRef = useRef<any>(null)

  const handleNext = () => calendarRef.current.getApi().next()
  const handleToday = () => calendarRef.current.getApi().today()
  const handlePrev = () => calendarRef.current.getApi().prev()

  const handleDayView = () =>
    calendarRef.current.getApi().changeView('timeGridDay')
  const handleMonthView = () =>
    calendarRef.current.getApi().changeView('dayGridMonth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startMs = new Date(startDate).getTime()
    const endMs = new Date(endDate).getTime()

    if (startMs > endMs) {
      alert('End date must be after start date')
      return
    }

    try {
      setIsSubmitting(true)
      await createEvent({
        title,
        startDate: startMs,
        endDate: endMs,
        color,
      })

      toast.success('Event added!')
      setTitle('')
      setStartDate('')
      setEndDate('')
      setColor('#e11d48')
      setOpen(false)
    } catch {
      toast.error('Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: any) => {
    try {
      setIsDeleting(true)
      await deleteEvent({ id })
      toast.success('Event deleted!')
      setDetailsDrawer(false)
    } catch {
      toast.error('Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col p-4 w-full h-full">
      {/* TOP BAR */}
      <div className="flex justify-between items-center py-2">
        {/* LEFT CONTROLS */}
        <div className="flex items-center gap-2">
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
                    required
                  />
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">Start</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="items-center gap-4 grid grid-cols-4">
                  <Label className="text-right">End</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="col-span-3"
                    required
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
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
                if (checked) handleDayView()
                else handleMonthView()
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
        {events === undefined && <SplashScreen />}

        {events !== undefined && (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            events={events.map((e: Doc<'calendarEvents'>) => ({
              id: e._id,
              title: e.title,
              start: new Date(e.startDate).toISOString(),
              end: new Date(e.endDate).toISOString(),
              color: e.color,
            }))}
            headerToolbar={{ left: 'title', center: '', right: '' }}
            height="100%"
            eventClick={(info) => {
              setSelectedEvent(info.event)
              setDetailsDrawer(true)
            }}
          />
        )}
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
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="rounded-full w-2 h-2 shrink-0"
                    style={{ background: selectedEvent.backgroundColor }}
                  />
                  <div className="flex-1 my-1.5 bg-border w-px" />
                  <div className="border-2 border-border rounded-full w-2 h-2 shrink-0" />
                </div>

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
                          return (
                            <span className="ml-1 normal-case">
                              · {h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`}
                            </span>
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
                disabled={isDeleting}
                onClick={() => handleDelete(selectedEvent.id)}
              >
                {isDeleting ? (
                  <>
                    <LoaderIcon className="stroke-white mr-2 w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
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
