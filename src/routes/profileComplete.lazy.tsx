import { profileComplete } from "@/components/profileComplete";

import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/profileComplete")({
  component: profileComplete,
});
