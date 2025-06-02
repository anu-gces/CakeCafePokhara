import { Help } from "@/components/help";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home/help")({
	component: Help,
});
