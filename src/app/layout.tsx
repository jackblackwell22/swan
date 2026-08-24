import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SITE_NAME, SITE_PLACE } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_PLACE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Family-run lock-up garages on Swan Street, Royal Leamington Spa. Units 7 to 12.",
  openGraph: {
    title: SITE_NAME,
    description:
      "Family-run lock-up garages on Swan Street, Royal Leamington Spa.",
    images: ["/images/swan-street-lock-ups.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
