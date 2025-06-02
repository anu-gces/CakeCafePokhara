import { Settings } from "@/components/settings";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home/settings")({
	component: Settings,
});
