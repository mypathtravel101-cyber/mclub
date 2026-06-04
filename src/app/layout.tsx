import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCLUB CRM — 百盛家族辦公室",
  description: "MCLUB客戶關係管理系統",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-[#0f1923] text-white`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
