import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingIncludes: {
    "/**": [
      "./data/**/*",
    ],
  },
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
  ],
};

export default nextConfig;
