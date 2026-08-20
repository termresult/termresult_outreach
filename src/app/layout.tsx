import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Outreach — TermResult",
    template: "%s | TermResult Outreach",
  },
  description: "Message FCT schools we already found — WhatsApp, SMS, and email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.className} min-h-full bg-white text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
