import { Calendar } from "@/components/calendar_mobile";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home/calendar")({
	component: Calendar,
});
