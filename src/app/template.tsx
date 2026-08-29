import RouteTransition from "@/components/RouteTransition";

export default function Template({ children }: LayoutProps<"/">) {
  return <RouteTransition>{children}</RouteTransition>;
}
