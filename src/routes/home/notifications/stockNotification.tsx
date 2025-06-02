import { StockNotification } from "@/components/notifications";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/home/notifications/stockNotification")({
  component: StockNotification,
});
