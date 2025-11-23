'use client';
import dynamic from "next/dynamic";

const APlayerClient = dynamic(() => import('./index'), {
  ssr: false,
});

export default APlayerClient;
