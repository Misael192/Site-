import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Flow UI é distribuído como fonte TSX — o Next transpila (ADR-012)
  transpilePackages: ["@peopleflow/ui"],
};

export default nextConfig;
