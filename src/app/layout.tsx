import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

const forgeAvant = localFont({
  src: [
    {
      path: "./fonts/avant-garde-extra-light.ttf",
      style: "normal",
      weight: "300",
    },
    {
      path: "./fonts/avant-garde-extra-light-oblique.ttf",
      style: "italic",
      weight: "300",
    },
    {
      path: "./fonts/avant-garde-medium.ttf",
      style: "normal",
      weight: "500",
    },
    {
      path: "./fonts/avant-garde-medium-oblique.ttf",
      style: "italic",
      weight: "500",
    },
  ],
  variable: "--font-forge-avant",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "ForgeOS | Manufacturing operations",
  description: "Factory execution, accountability, and operational control.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={forgeAvant.variable}>{children}</body>
    </html>
  );
}
