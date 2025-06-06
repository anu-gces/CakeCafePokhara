import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerWithPresetsProps {
	selected: Date | undefined;
	onSelect: (date: Date | undefined) => void;
}

export function DatePickerWithPresets({
	selected,
	onSelect,
}: DatePickerWithPresetsProps) {
	const [date, setDate] = React.useState<Date | undefined>(selected);
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		setDate(selected);
	}, [selected]);

	const handleSelect = (date: Date | undefined) => {
		setDate(date);
		onSelect(date);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={"outline"}
					className={cn(
						"w-[280px] justify-start text-left font-normal",
						!date && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="flex w-auto flex-col space-y-2 p-2">
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
						<SelectItem value="1">Tomorrow</SelectItem>
						<SelectItem value="3">In 3 days</SelectItem>
						<SelectItem value="7">In a week</SelectItem>
					</SelectContent>
				</Select>
				<div className="rounded-md border">
					<Calendar mode="single" selected={date} onSelect={handleSelect} />
				</div>
			</PopoverContent>
		</Popover>
	);
}
