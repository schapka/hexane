/**
 * Nitro Configuration for Hexane POC
 *
 * This configuration demonstrates how Hexane abstracts Nitro,
 * similar to how Nuxt abstracts Nitro but for backend APIs.
 */

import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  // Source directory structure
  srcDir: ".",

  // Server handlers (Nitro will auto-scan these directories)
  // We'll use routes/ for our module tree entry point
  scanDirs: ["routes"],

  // Build output
  output: {
    dir: ".output",
  },

  // Runtime compatibility
  compatibilityDate: "2024-11-22",

  // TypeScript configuration
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: "bundler",
        module: "ESNext",
        target: "ESNext",
      },
    },
  },

  // Preset for deployment target (default: node-server)
  // Can be changed to: cloudflare, vercel, netlify, etc.
  // Tested and working presets:
  // - node-server (default)
  // - cloudflare-pages ✓
  // - vercel ✓
  preset: "node-server",

  // Enable experimental features if needed
  experimental: {
    // Future: could enable features here
  },

  // Logging
  logLevel: 3, // 0-5, 3 = info
});
