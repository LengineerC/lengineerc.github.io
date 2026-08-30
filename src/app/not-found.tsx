import type { Metadata } from "next";
import ErrorPage from "@/views/404";

export const metadata: Metadata = {
  title: "页面未找到",
};

export default function NotFound() {
  return <ErrorPage />;
}
