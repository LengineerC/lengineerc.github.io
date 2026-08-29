import type { Metadata } from "next";
import Toolbox from "@/views/Toolbox";
import IPAInput from "@/components/IPAInput";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("IPA 输入", "/toolbox/ipa-input");
export default function Page() { return <Toolbox subtitle="ipa-input"><IPAInput /></Toolbox>; }
