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
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Several /api/* GET routes are now role-gated (RBAC). The default
        // same-origin API cache rule (NetworkFirst, 24h, survives logout,
        // keyed by URL only — not by the Authorization header apiFetch adds)
        // could otherwise replay a privileged cached response to a more
        // restricted role offline or on a slow connection. Registered first
        // so it wins over the default rule this extends; every other
        // default caching behavior (images, fonts, pages, JS/CSS) is kept.
        urlPattern: ({ sameOrigin, url: { pathname } }) =>
          sameOrigin && pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        method: 'GET',
      },
    ],
  },
})(config);

export default nextConfig;
