import type { Metadata } from "next";
import Toolbox from "@/views/Toolbox";
import Unicode from "@/components/Unicode";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Unicode 转换器", "/toolbox/unicode");
export default function Page() { return <Toolbox subtitle="unicode"><Unicode /></Toolbox>; }
