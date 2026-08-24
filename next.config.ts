import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3", "pdfkit", "nodemailer", "node-cron"],
};

export default nextConfig;
