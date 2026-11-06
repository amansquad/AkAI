import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Noto_Sans_Ethiopic, Noto_Serif_Ethiopic } from "next/font/google";
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

// Landing page type system. Archivo's width axis gives the condensed-to-
// expanded range of stamp denominations; Noto Serif Ethiopic carries Ge'ez at
// display size (engraved feel), Noto Sans Ethiopic carries it in UI text.
// Both Ethiopic faces are a hard requirement: few webfonts cover Ge'ez.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  variable: "--font-noto-serif-ethiopic",
  subsets: ["ethiopic"],
});

export const metadata: Metadata = {
  title: "AkAI - Amharic Keyboard + AI | English & Amharic Bilingual Keyboard",
  description: "AkAI: The smartest bilingual keyboard for English and Amharic. AI translation, stickers, GIFs, handwriting, 170+ themes, Ethiopian numbers, word suggestions.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${notoSansEthiopic.variable} ${notoSerifEthiopic.variable} antialiased bg-background text-foreground`}
      >
        {/*
          THESIS: AkAI is a letter home. Two scripts, one envelope: the
          landing page is an airmail sheet of Ethiopian-style stamps where
          English and Amharic are printed at identical weight. Refuses the
          dark-SaaS emerald gradient hero with an icon-card grid.
          OWN-WORLD: Drenched ultramarine airmail ground with a red/white/blue
          chevron border; perforated postage stamps in flag inks (green,
          yellow, red) on stamp paper; Archivo width-axis display, Noto Serif
          Ethiopic engraved Ge'ez; a dark circular postmark as the one stamp
          of authority.
          STORY: Visitor sees the English and Amharic stamps share one
          sentence, watches the postmark land (translation), tries the real
          keyboard inline, and downloads the APK.
          FIRST VIEWPORT: Left, 'One keyboard. Both languages. No compromise.'
          at display size with the APK download button; right, an English and
          an Amharic stamp tilted into each other with a postmark falling on
          the pair every few seconds.
          FORM: Direction 7 of own grounded list (Ethiopian postage stamp
          sheet), seed key 79b3f41b.
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
