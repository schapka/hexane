/**
 * Hexane Framework - Nitro Integration Layer
 *
 * ⚠️ FRAMEWORK INTERNAL FILE - Users should never need to modify this! ⚠️
 *
 * This file is automatically provided by Hexane to integrate with Nitro.
 * Users just export their AppModule from app/main.ts and Hexane handles
 * the rest.
 *
 * How it works:
 * 1. User defines modules in app/
 * 2. User exports AppModule from app/main.ts
 * 3. Hexane (this file) imports it and sets up Nitro integration
 * 4. Nitro handles build/deployment
 *
 * Architecture:
 * - Catch-all route pattern delegates all requests to h3 app
 * - Module tree is traversed once at startup
 * - All routes registered with h3's router
 * - Compatible with all Nitro deployment targets
 */

import { defineEventHandler } from "h3";
import { createH3AppFromModule } from "../core";
import { AppModule } from "../app/main";

// Build the h3 app from our module tree
const { app, routes, providers } = createH3AppFromModule(AppModule);

// Log startup info (only in dev mode)
if (import.meta.dev) {
  console.log("\n🔷 Hexane App Starting");
  console.log("\n📋 Registered Routes:");
  for (const route of routes) {
    console.log(`  ${route.method.padEnd(6)} ${route.path}`);
  }
  console.log("\n📦 Registered Providers:");
  for (const provider of providers) {
    console.log(`  - ${provider.name || provider}`);
  }
  console.log("");
}

// Export as an event handler that Nitro can use
// This catch-all route ([...].ts) will handle all requests
// and delegate them to our h3 app's handler
export default defineEventHandler((event) => {
  return app.handler(event);
});
