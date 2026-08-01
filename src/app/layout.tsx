import type { Metadata } from "next";
import { Geist, Geist_Mono, VT323, Noto_Sans_Ethiopic } from "next/font/google";
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

// Landing page ("Old Way / New Way") type system — see the direction
// contract below. VT323 carries the retro multi-tap-keypad LCD register;
// Noto Sans Ethiopic is a hard technical requirement, not a style choice —
// it's one of the few webfonts with real Ge'ez glyph coverage.
const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} ${notoSansEthiopic.variable} antialiased bg-background text-foreground`}
      >
        {/*
          THESIS: Multi-tap Amharic typing was real, remembered pain — press 4
          four times to cycle a vowel form. AkAI ends it: full Ge'ez fidel and
          English on one native keyboard, AI translation built in. Refuses the
          generic dark-SaaS gradient-hero-plus-icon-grid template this
          category defaults to.
          OWN-WORLD: A retro monochrome multi-tap keypad — VT323 pixel type,
          amber phosphor glow, near-black ground — that visibly dissolves
          into AkAI's real, working keyboard: Geist type, one committed
          emerald accent, warm neutral surface, real Ge'ez glyphs via Noto
          Sans Ethiopic.
          STORY: Visitor recognizes the old multi-tap pain, watches it
          resolve into the real AkAI keyboard running live on the page,
          believes both languages are equally native here, downloads the app.
          FIRST VIEWPORT: Full-bleed near-black stage; an amber LCD readout
          counts multi-tap presses above a 12-key retro keypad; on scroll it
          dissolves as the real functional AkAI keyboard fades in beneath a
          headline crossfading from pixel "OLD WAY" to "One keyboard. Both
          languages. No compromise."
          FORM: Direction 7 of 7 ranked candidates (multi-tap keypad
          nostalgia), seed key 25e1060b.
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
