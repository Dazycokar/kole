import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, DM_Mono } from "next/font/google";
import Header from "@/components/Header";
import { SITE } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--ff-display",
  display: "swap",
});
const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-body",
  display: "swap",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

const themeInit = `try{var t=localStorage.getItem('kole-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
