import { getBusinessConfig } from "@/lib/config";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getBusinessConfig();
  return (
    <>
      <SiteHeader businessName={config.name} />
      <main className="flex-1">{children}</main>
      <SiteFooter config={config} />
    </>
  );
}
