import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isAcceptingEnquiries } from "@/lib/settings";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accepting = isAcceptingEnquiries();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Header acceptingEnquiries={accepting} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer acceptingEnquiries={accepting} />
    </>
  );
}
