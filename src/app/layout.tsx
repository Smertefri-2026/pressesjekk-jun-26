import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PresseSjekk – strukturert kontroll av medieomtale",
    template: "%s | PresseSjekk",
  },
  description:
    "PresseSjekk hjelper deg å vurdere medieomtale, tilsvar, dokumentasjon og mulige presseetiske problemstillinger på ett sted.",
  keywords: [
    "PresseSjekk",
    "presseetikk",
    "medieomtale",
    "tilsvar",
    "PFU",
    "Vær Varsom-plakaten",
    "mediesaker",
    "dokumentasjon",
  ],
  authors: [{ name: "PresseSjekk" }],
  creator: "PresseSjekk",
  publisher: "PresseSjekk",
  metadataBase: new URL("https://pressesjekk.no"),
  openGraph: {
    title: "PresseSjekk – strukturert kontroll av medieomtale",
    description:
      "Vurder medieomtale, tilsvar, dokumentasjon og mulige presseetiske problemstillinger på ett sted.",
    url: "https://pressesjekk.no",
    siteName: "PresseSjekk",
    locale: "no_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PresseSjekk – strukturert kontroll av medieomtale",
    description:
      "Vurder medieomtale, tilsvar, dokumentasjon og mulige presseetiske problemstillinger på ett sted.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
