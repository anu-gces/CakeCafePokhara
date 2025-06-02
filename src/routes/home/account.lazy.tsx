import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home/account")({
	component: () => <div>Hello /home/account!</div>,
});
