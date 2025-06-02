import { Stock } from "@/components/stock";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/home/stock")({
  component: Stock,
});
