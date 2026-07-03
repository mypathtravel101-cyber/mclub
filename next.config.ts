import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Scope file tracing to the project root, but rely on tsconfig.exclude
  // to keep standalone output lean (avoids bundling skills/, scripts/, etc.)
  outputFileTracingRoot: path.resolve(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable Next.js Image optimization (avoids sharp native binary dependency)
  // We use regular <img> tags throughout the app, so this is safe.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
