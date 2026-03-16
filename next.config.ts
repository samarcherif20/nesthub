import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.config.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.clerk.accounts.dev",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
