import type { Metadata } from "next";
import Toolbox from "@/views/Toolbox";
import ToolMenu from "@/views/Toolbox/ToolMenu";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("工具箱", "/toolbox");
export default function Page() { return <Toolbox subtitle="menu"><ToolMenu /></Toolbox>; }
