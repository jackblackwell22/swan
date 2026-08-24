import { getBusinessConfig } from "@/lib/config";
import { isAcceptingEnquiries } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getBusinessConfig();
  const acceptingEnquiries = isAcceptingEnquiries();
  return (
    <>
      <SiteHeader businessName={config.name} acceptingEnquiries={acceptingEnquiries} />
      <main className="flex-1">{children}</main>
      <SiteFooter config={config} acceptingEnquiries={acceptingEnquiries} />
    </>
  );
}
