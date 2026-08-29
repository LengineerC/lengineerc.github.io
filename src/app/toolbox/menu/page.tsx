import Toolbox from "@/views/Toolbox";
import ToolMenu from "@/views/Toolbox/ToolMenu";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("工具箱", "/toolbox/menu");
export default function Page() { return <Toolbox subtitle="menu"><ToolMenu /></Toolbox>; }
