import type { Metadata } from "next";
import "./globalStyles.css";
import StyledComponentsRegistry from "./registry";
import { ClientRecoilRoot } from "./recoil";

export const metadata: Metadata = {
  title: "Dofus Optimiser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientRecoilRoot>
        <StyledComponentsRegistry>
          <body>{children}</body>
        </StyledComponentsRegistry>
      </ClientRecoilRoot>
    </html>
  );
}
