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
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "vbo9rhe8h0j7ewhr.private.blob.vercel-storage.com",
        pathname: "/**",
      },
      // Pour le développement local
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
    ],
  },
  //  AJOUTE CETTE PARTIE POUR LES UPLOADS (>10MB)
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
};
export default withNextIntl(nextConfig);
