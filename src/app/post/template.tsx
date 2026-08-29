import type { ReactNode } from "react";
import RouteTransition from "@/components/RouteTransition";

export default function Template({ children }: { children: ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
