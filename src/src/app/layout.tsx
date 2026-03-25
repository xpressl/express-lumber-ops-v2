import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Express Lumber Ops",
    template: "%s | Express Lumber Ops",
  },
  description: "Operational control layer for wholesale building materials distribution",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1c1c22" },
    { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", instrumentSans.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
