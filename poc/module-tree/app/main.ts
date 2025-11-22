/**
 * User Application Entry Point
 *
 * This is the ONLY file users need to create to bootstrap their Hexane app.
 * Simply export your root module and Hexane handles the rest!
 */

export { AppModule } from './app.module'

// That's it! Hexane automatically:
// - Discovers your root module
// - Traverses the module tree
// - Registers all routes with Nitro
// - Handles deployment to any target (Node, Cloudflare, Vercel, etc.)
//
// No need to deal with Nitro internals, routing setup, or server configuration.
// Just define your modules and go! 🚀
