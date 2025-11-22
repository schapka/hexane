# Nitro Integration Comparison: Plugin vs Catch-All Route

## Question

Would it make more sense for Hexane to integrate with Nitro as a plugin rather than using a catch-all route?

## TL;DR

**No - the catch-all route pattern is the correct approach.** While Nitro plugins seem conceptually cleaner, they have timing/lifecycle limitations that prevent them from properly registering routes.

## Approaches Tested

### Approach 1: Catch-All Route (`routes/[...].ts`) ✅ WORKS

**Implementation:**
```typescript
// routes/[...].ts
import { defineEventHandler } from 'h3'
import { createH3AppFromModule } from '../core'
import { AppModule } from '../example-app/app.module'

const { app, routes, providers } = createH3AppFromModule(AppModule)

export default defineEventHandler((event) => {
  return app.handler(event)
})
```

**Pros:**
- ✅ Works perfectly - all routes serve correctly
- ✅ Registered at build time as part of Nitro's file-based routing
- ✅ Simple and explicit
- ✅ No timing/lifecycle issues
- ✅ Compatible with all Nitro presets (node-server, cloudflare, vercel, etc.)
- ✅ Similar to how other frameworks integrate (e.g., tRPC uses this pattern)

**Cons:**
- ⚠️ Feels like a "workaround" at first glance
- ⚠️ Creates one level of indirection (Nitro → catch-all → h3 app)

### Approach 2: Nitro Plugin (`plugins/hexane.ts`) ❌ DOESN'T WORK

**Implementation:**
```typescript
// plugins/hexane.ts
export default defineNitroPlugin((nitroApp) => {
  const { app, routes, providers } = createH3AppFromModule(AppModule)

  // Attempt 1: Register entire h3 app as middleware
  nitroApp.h3App.use(eventHandler((event) => {
    return app.handler(event)
  }))

  // Attempt 2: Register individual routes
  for (const route of routes) {
    nitroApp.h3App.router[route.method.toLowerCase()](route.path, route.handler)
  }
})
```

**Result:**
- ❌ Routes return 404
- ❌ Plugin loads but routes aren't properly served
- ❌ Timing issue: plugins run AFTER Nitro's routing system is configured

**Pros:**
- ✅ Conceptually cleaner separation
- ✅ Could be extended with lifecycle hooks in the future

**Cons:**
- ❌ Doesn't actually work for route registration
- ❌ Nitro plugins run too late in the lifecycle
- ❌ Adding middleware in plugins doesn't integrate with Nitro's router properly
- ❌ More complex debugging

## Root Cause Analysis

### Why Plugins Don't Work

1. **Lifecycle Timing**: Nitro's routing system is configured before plugins run
2. **Middleware vs Routes**: Adding middleware in a plugin doesn't register routes with Nitro's router
3. **Router Immutability**: The router configuration is essentially "closed" by the time plugins execute

### Why Catch-All Routes Work

1. **Build-Time Registration**: File-based routes in `routes/` are detected and registered at build time
2. **Native Integration**: Nitro treats `routes/[...].ts` as a legitimate route handler
3. **Proper Delegation**: The catch-all pattern is explicitly designed for this use case

## Industry Precedent

Other frameworks use the same pattern:

**tRPC + Nitro:**
```typescript
// routes/trpc/[trpc].ts
export default defineEventHandler((event) => {
  return trpcHandler(event)
})
```

**SvelteKit:**
Uses a similar catch-all approach (`[...path]`) for integrating with adapters

**Remix:**
Uses catch-all routes for their Nitro adapter

## Recommendation

**Use the catch-all route pattern (`routes/[...].ts`)** because:

1. It actually works
2. It's a well-established pattern in the Nitro ecosystem
3. It's simple and maintainable
4. It provides the flexibility Hexane needs (module tree composition)
5. It's compatible with all deployment targets

## When Plugins ARE Useful

Nitro plugins are still valuable for Hexane, but for different purposes:

- ✅ Adding middleware (cors, compression, logging)
- ✅ Initialization logic (database connections, caching)
- ✅ Runtime hooks (request/response transformation)
- ✅ Development tooling (debug logging, metrics)
- ❌ NOT for registering application routes

## Final Architecture

**Hexane's Nitro Integration:**

```
routes/[...].ts          ← Catch-all route (build-time registration)
  ↓
createH3AppFromModule()  ← Build module tree
  ↓
h3 app with routes       ← Handle all application routing
```

**Optional Plugins:**
```
plugins/
  ├── middleware.ts      ← Add CORS, compression, etc.
  ├── database.ts        ← Initialize DB connections
  └── logging.ts         ← Request logging
```

This gives us the best of both worlds:
- Routes work properly (catch-all)
- Extensibility through plugins (middleware, init, hooks)

## Conclusion

While plugins seemed conceptually cleaner, the catch-all route pattern is the **correct and proven approach** for integrating a module-based framework with Nitro. It's not a hack - it's how the ecosystem is designed to work.

The catch-all route provides:
- ✅ Reliable route registration
- ✅ Full control over routing
- ✅ Compatibility with Nitro's build system
- ✅ Alignment with ecosystem patterns

Hexane's abstraction of Nitro through module tree + catch-all route is **as elegant as Nuxt's abstraction**, just serving a different purpose (explicit API composition vs file-based routing).
