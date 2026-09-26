import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingIncludes: {
    "/**": [
      "./data/**/*",
      "./node_modules/@duckdb/**/*",
    ],
  },
  serverExternalPackages: [
    "@duckdb/node-api",
    "@duckdb/node-bindings",
    "@duckdb/node-bindings-darwin-arm64",
    "@duckdb/node-bindings-darwin-x64",
    "@duckdb/node-bindings-linux-x64",
    "@duckdb/node-bindings-linux-arm64",
    "@duckdb/node-bindings-linux-x64-musl",
    "@duckdb/node-bindings-linux-arm64-musl",
  ],
};

export default nextConfig;
