import type { ReactNode } from "react";
import FloatBtnGroup from "@/components/FloatBtnGroup";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <main style={{ position: "relative" }}>
      {children}
      <FloatBtnGroup />
    </main>
  );
}
