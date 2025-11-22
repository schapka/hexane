/**
 * Root Application Module
 *
 * This is the entry point of the module tree.
 * It imports all feature modules and orchestrates the application.
 */

import { defineModule, defineRoute } from '../core'
import { defineEventHandler } from 'h3'
import { UsersModule } from './modules/users/users.module'
import { ProductsModule } from './modules/products/products.module'

// Root-level route (health check)
const healthCheck = defineRoute('GET', '/health', defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
}))

// Root-level route (API info)
const apiInfo = defineRoute('GET', '/api', defineEventHandler(() => {
  return {
    name: 'Hexane POC API',
    version: '0.0.1',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
    },
  }
}))

/**
 * Root Application Module
 *
 * Imports feature modules and provides root-level routes.
 */
export const AppModule = defineModule({
  name: 'app',

  // Import feature modules
  imports: [
    UsersModule,
    ProductsModule,
  ],

  // Root-level routes
  routes: [
    healthCheck,
    apiInfo,
  ],

  // Root-level providers (if any)
  providers: [],
})
