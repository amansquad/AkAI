import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KeyFlow - English & Amharic Keyboard with AI Translation",
  description: "The smartest bilingual keyboard for English and Amharic. Featuring AI translation, stickers, GIFs, clipboard manager, and the full Ge'ez script.",
  keywords: ["keyboard", "Amharic", "English", "bilingual", "AI translation", "Ge'ez", "stickers", "GIFs", "clipboard"],
  authors: [{ name: "KeyFlow Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "KeyFlow - Bilingual Keyboard",
    description: "English & Amharic keyboard with AI translation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyFlow - Bilingual Keyboard",
    description: "English & Amharic keyboard with AI translation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
