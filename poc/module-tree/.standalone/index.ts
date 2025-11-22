/**
 * Standalone Server (Optional)
 *
 * This demonstrates running Hexane without Nitro (pure Node.js).
 * Most users will just use `npm run dev` (Nitro), but this shows
 * that Hexane's core can run standalone for testing or legacy environments.
 */

import { createApp } from "../core";
import { AppModule } from "../app/main";

// Create app from root module
const app = await createApp(AppModule);

// Debug: Show registered routes
console.log("\n📋 Registered routes:");
for (const route of app.getRoutes()) {
  console.log(`  ${route.method.padEnd(6)} ${route.path}`);
}

// Debug: Show registered providers
console.log("\n📦 Registered providers:");
for (const provider of app.getProviders()) {
  console.log(`  - ${provider.name || provider}`);
}
console.log("");

// Start server
await app.listen(3000);
