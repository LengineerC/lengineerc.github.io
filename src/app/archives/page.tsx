import type { Metadata } from "next";
import Archives from "@/views/Archives";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("归档", "/archives");
export default function Page() { return <Archives />; }
