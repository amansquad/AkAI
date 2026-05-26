import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "AkAI - Amharic Keyboard + AI | English & Amharic Bilingual Keyboard",
  description: "AkAI: The smartest bilingual keyboard for English and Amharic. AI translation, stickers, GIFs, handwriting, 20+ themes, Ethiopian numbers, word suggestions.",
  keywords: ["AkAI", "keyboard", "Amharic", "English", "bilingual", "AI translation", "Ge'ez", "stickers", "GIFs", "handwriting", "themes", "Ethiopian"],
  authors: [{ name: "AkAI Team" }],
  icons: {
    icon: "/akai-icon.png",
  },
  openGraph: {
    title: "AkAI - Amharic Keyboard + AI",
    description: "English & Amharic keyboard with AI translation, handwriting, themes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AkAI - Amharic Keyboard + AI",
    description: "English & Amharic keyboard with AI translation, handwriting, themes",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
