import { editMenu } from "@/components/restaurant_mobile/editMenu";
import { createFileRoute } from "@tanstack/react-router";
export type MenuCategory = "appetizers" | "main_courses" | "desserts" | "beverages" | "hard_drinks" | "specials";

type Search = {
  category: MenuCategory;
};

export const Route = createFileRoute("/home/editMenu")({
  validateSearch: (search: Record<string, unknown>): Search => {
    return {
      category: (search.category as MenuCategory) || "",
    };
  },
  component: editMenu,
});
