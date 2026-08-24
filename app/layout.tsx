import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { getBusinessConfig } from "@/lib/config";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const config = getBusinessConfig();

export const metadata: Metadata = {
  title: {
    default: `${config.name} · Leamington Spa`,
    template: `%s · ${config.name}`,
  },
  description:
    "Family-run lock-up garages on Swan Street, Royal Leamington Spa. Let to local businesses and private tenants.",
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    title: `${config.name} · Leamington Spa`,
    description:
      "Family-run lock-up garages on Swan Street, Royal Leamington Spa.",
    images: ["/images/lock-ups.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${newsreader.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
