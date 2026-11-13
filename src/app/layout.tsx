import type { Metadata } from "next";
import { Geist, Geist_Mono, Big_Shoulders, Noto_Sans_Ethiopic } from "next/font/google";
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

// Landing type: Big Shoulders is condensed signboard lettering; Noto Sans
// Ethiopic (heavy weights) carries Ge'ez at the same weight, so both scripts
// read as one painted sign. Few webfonts cover Ge'ez, so this one is required.
const bigShoulders = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
});

export const metadata: Metadata = {
  title: "AkAI - Amharic Keyboard + AI | English & Amharic Bilingual Keyboard",
  description: "AkAI: The smartest bilingual keyboard for English and Amharic. AI translation, stickers, GIFs, handwriting, 170+ themes, Ethiopian numbers, word suggestions.",
  keywords: ["AkAI", "keyboard", "Amharic", "English", "bilingual", "AI translation", "Ge'ez", "stickers", "GIFs", "handwriting", "themes", "Ethiopian"],
  authors: [{ name: "AkAI Team" }],
  // New file names (not akai-icon.png) so browsers and the service worker
  // can't keep showing the old icon from their caches.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
        className={`${geistSans.variable} ${geistMono.variable} ${bigShoulders.variable} ${notoSansEthiopic.variable} antialiased bg-background text-foreground`}
      >
        {/*
          THESIS: AkAI is a shopfront sign. In Addis, one painted board carries
          Amharic and English at equal weight; the landing page is that board.
          Refuses the dark-SaaS gradient hero with an icon-card grid.
          OWN-WORLD: Corrugated enamel-teal sheet metal; riveted painted signs
          in vermilion, saffron, sky and chalk-white enamel with ink keylines and
          hard flat shadows; Big Shoulders condensed lettering beside heavy Noto
          Ethiopic; a round painted decal as the one mark of translation.
          STORY: Visitor sees English and Amharic signs share one sentence,
          watches the decal land (translation), tries the real keyboard inline,
          and downloads the APK.
          FIRST VIEWPORT: Left, 'One keyboard. Both languages. No compromise.'
          at display size with the APK download button; right, an English and
          an Amharic sign tilted together with the decal landing on the pair.
          FORM: Own list, candidate 7 (Addis hand-painted signboards), seed d65232a5.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md.
        */}
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
