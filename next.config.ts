import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the dev-mode route indicator (the small badge in the corner).
  // Next.js will still surface real compile/runtime errors regardless.
  devIndicators: false,
};

export default nextConfig;
