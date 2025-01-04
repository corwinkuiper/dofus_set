"use client";

import { ReactNode } from "react";
import { RecoilRoot } from "recoil";

interface ClientRecoilRootProps {
  children: ReactNode;
}

export function ClientRecoilRoot({ children }: ClientRecoilRootProps) {
  return <RecoilRoot>{children}</RecoilRoot>;
}
