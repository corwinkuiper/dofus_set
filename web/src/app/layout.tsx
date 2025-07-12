import type { Metadata } from "next";
import "./globalStyles.css";
import StyledComponentsRegistry from "./registry";

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
      <StyledComponentsRegistry>
        <body>{children}</body>
      </StyledComponentsRegistry>
    </html>
  );
}
