/**
 * POC: Core Module System
 *
 * Simple implementation to validate module tree pattern
 */

import type { EventHandler } from 'h3'
import { createApp as createH3App, createRouter as createH3Router, toNodeListener } from 'h3'
import { createServer } from 'node:http'

// ============================================================================
// Types
// ============================================================================

/**
 * A provider can be:
 * - A class constructor
 * - A factory function
 * - A value
 */
export type Provider = any // Keep simple for POC

/**
 * Route definition
 */
export interface RouteDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: EventHandler
}

/**
 * Module definition
 */
export interface ModuleDefinition {
  /** Optional module name for debugging */
  name?: string

  /** Other modules this module depends on */
  imports?: ModuleDefinition[]

  /** Routes provided by this module */
  routes?: RouteDefinition[]

  /** Services/providers this module registers */
  providers?: Provider[]

  /** Providers that other modules can use */
  exports?: Provider[]
}

/**
 * Application instance
 */
export interface HexaneApp {
  /** Start the server */
  listen(port: number): Promise<void>

  /** Get all registered routes (for debugging) */
  getRoutes(): RouteDefinition[]

  /** Get all registered providers (for debugging) */
  getProviders(): Provider[]
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Define a module
 *
 * Simple helper that returns the module definition.
 * Main benefit: type checking and consistent structure.
 */
export function defineModule(definition: ModuleDefinition): ModuleDefinition {
  return definition
}

/**
 * Build h3 app from root module
 *
 * Traverses the module tree, collects routes and providers,
 * and creates an h3 app instance.
 *
 * This is the core function used by both standalone Node.js apps
 * and Nitro integration.
 */
export function createH3AppFromModule(rootModule: ModuleDefinition) {
  // Collect all routes and providers from module tree
  const routes: RouteDefinition[] = []
  const providers: Provider[] = []

  // Traverse module tree (depth-first)
  function traverseModule(module: ModuleDefinition, visited = new Set<ModuleDefinition>()) {
    // Prevent circular dependencies
    if (visited.has(module)) {
      return
    }
    visited.add(module)

    // Process imports first (dependencies)
    if (module.imports) {
      for (const imported of module.imports) {
        traverseModule(imported, visited)
      }
    }

    // Collect routes
    if (module.routes) {
      routes.push(...module.routes)
    }

    // Collect providers
    if (module.providers) {
      providers.push(...module.providers)
    }
  }

  traverseModule(rootModule)

  // Create h3 app
  const h3App = createH3App()
  const router = createH3Router()

  // Register all collected routes
  for (const route of routes) {
    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch'
    router[method](route.path, route.handler)
  }

  // Add router to app
  h3App.use(router)

  return {
    app: h3App,
    routes,
    providers,
  }
}

/**
 * Create application from root module (Standalone Node.js)
 *
 * Creates a complete application with Node.js HTTP server.
 * Use this for standalone apps not using Nitro.
 */
export async function createApp(rootModule: ModuleDefinition): Promise<HexaneApp> {
  const { app: h3App, routes, providers } = createH3AppFromModule(rootModule)

  // Create Node.js server for standalone usage
  const nodeHandler = toNodeListener(h3App)
  const server = createServer(nodeHandler)

  return {
    async listen(port: number) {
      return new Promise((resolve) => {
        server.listen(port, () => {
          console.log(`🚀 Server listening on http://localhost:${port}`)
          resolve()
        })
      })
    },

    getRoutes() {
      return routes
    },

    getProviders() {
      return providers
    }
  }
}

/**
 * Define a route
 *
 * Helper for creating route definitions.
 * In the future, this would integrate with the Guards/Extractors pattern.
 */
export function defineRoute(
  method: RouteDefinition['method'],
  path: string,
  handler: EventHandler
): RouteDefinition {
  return { method, path, handler }
}
