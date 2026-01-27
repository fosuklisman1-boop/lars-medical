import type { NextConfig } from "next";

import withPWA from "@ducanh2912/next-pwa";

const config: NextConfig = {
  devIndicators: false,
};

const nextConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false, // Enable PWA in development too for testing
  workboxOptions: {
    disableDevLogs: true,
  },
})(config);

export default nextConfig;

