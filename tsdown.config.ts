import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      webchat: "src/client/webchat/webchat.ts",
      "react/index": "src/react/index.tsx",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    minify: true,
    platform: "neutral",
    outDir: "dist",
  },
  {
    entry: { "browser/index.global": "src/browser.ts" },
    format: ["iife"],
    dts: false,
    sourcemap: true,
    minify: true,
    platform: "browser",
    outDir: "dist",
    outputOptions: {
      name: "Bland",
      exports: "named",
      globals: { "isomorphic-ws": "WebSocket" },
    },
  },
]);
