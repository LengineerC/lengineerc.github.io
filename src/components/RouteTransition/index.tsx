import "./index.scss";
import type { ReactNode } from "react";

export default function RouteTransition({ children }: { children: ReactNode }) {
  return <div className="route-page-enter">{children}</div>;
}
