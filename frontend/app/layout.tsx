import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IdeaForge AI | Discover Validated SaaS Ideas",
  description: "Discover validated SaaS ideas from real world problems in seconds.",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-[#fb611e]/30 font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
