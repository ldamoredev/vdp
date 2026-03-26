import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Point to the monorepo root so Next.js traces dependencies correctly
  outputFileTracingRoot: resolve(__dirname, "../../"),
};

export default nextConfig;
