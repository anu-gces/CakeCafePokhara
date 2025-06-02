import { createLazyFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/dashboard_mobile/dashboard";
import { Error404 } from "@/components/error404";
import SplashScreen from "@/components/splashscreen";

export const Route = createLazyFileRoute("/home/dashboard")({
  component: Dashboard,
  pendingComponent: SplashScreen,
  notFoundComponent: Error404,
});
