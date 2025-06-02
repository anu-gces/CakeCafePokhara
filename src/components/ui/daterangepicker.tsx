import { format, parseISO, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { useEffect } from "react";

export function CalendarDateRangePicker({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const search = useSearch({ from: "/home/dashboard" });
  const navigate = useNavigate();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: search.from ? parseISO(search.from) : subDays(new Date(), 7), // Use `from` from search or default to 7 days prior
    to: search.to ? parseISO(search.to) : new Date(), // Use `to` from search or default to today
  });

  useEffect(() => {
    if (date) {
      const formattedDate = {
        from: date.from ? format(date.from, "yyyy-MM-dd") : undefined,
        to: date.to ? format(date.to, "yyyy-MM-dd") : undefined,
      };

      // Navigate with the from and to parameters
      navigate({
        to: "/home/dashboard",
        search: (prev: { [key: string]: string }) => ({
          ...prev,
          ...formattedDate,
        }),
      });
    } else {
      // Remove the from and to parameters from the URL
      navigate({
        to: "/home/dashboard",
        search: (prev: { [key: string]: string }) => {
          const { from, to, ...rest } = prev;
          return rest;
        },
      });
    }
  }, [date, navigate]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("max-w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 w-4 h-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto translate-x-2 md:translate-x-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
