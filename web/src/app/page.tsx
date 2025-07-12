"use client";

import dynamic from "next/dynamic";

const Optimise = dynamic(
  () => import("@/components/optimise").then((x) => x.Optimise),
  { ssr: false }
);

export default function Home() {
  return <Optimise />;
}
