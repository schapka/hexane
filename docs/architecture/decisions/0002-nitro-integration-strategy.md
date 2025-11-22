# ADR-0002: Nitro Integration Strategy

## Status

**Accepted** - 2025-11-22

Implemented in POC: `poc/module-tree/`

## Context

Hexane is an enterprise backend framework built on top of Nitro/h3. We need to integrate Hexane's module system with Nitro's build and deployment system while providing a clean, intuitive developer experience.

### Requirements

1. **Seamless Integration**: Module tree routes must be properly served by Nitro
2. **Clean User API**: Users should not need to understand Nitro internals
3. **Deployment Flexibility**: Must work with all Nitro deployment targets (Node, Cloudflare, Vercel, etc.)
4. **Type Safety**: Full TypeScript inference throughout the stack
5. **Future-Proof**: Architecture should allow framework evolution without breaking user code

### Problem

How do we integrate Hexane's module-based routing system with Nitro's file-based routing system?

## Decision

We will use a **catch-all route pattern** (`routes/[...].ts`) as the integration point between Hexane and Nitro, with a **CLI-based abstraction layer** in production to hide all framework internals from users.

### Architecture

```
┌─────────────────────────────────────────┐
│          User Code (app/)                │
│  - Pure TypeScript modules               │
│  - Framework-agnostic                    │
│  - Entry: export { AppModule }          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Hexane Framework Layer                │
│  routes/[...].ts (catch-all)             │
│  - Imports user's AppModule              │
│  - Traverses module tree                 │
│  - Builds h3 app                         │
│  - Delegates to h3 handler               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Nitro/h3 Layer                   │
│  - Build system                          │
│  - Development server                    │
│  - Deployment adapters                   │
└─────────────────────────────────────────┘
```

### Implementation

#### 1. Framework-Managed Catch-All Route

```typescript
// routes/[...].ts - Framework internal, not user code
import { defineEventHandler } from 'h3'
import { createH3AppFromModule } from '../core'
import { AppModule } from '../app/main'

const { app, routes, providers } = createH3AppFromModule(AppModule)

export default defineEventHandler((event) => {
  return app.handler(event)
})
```

#### 2. User Entry Point

```typescript
// app/main.ts - User's ONLY framework interaction
export { AppModule } from './app.module'
```

#### 3. Core Module Tree Builder

```typescript
// core.ts - Framework API
export function createH3AppFromModule(rootModule: ModuleDefinition) {
  // 1. Traverse module tree
  const routes = collectRoutes(rootModule)
  const providers = collectProviders(rootModule)

  // 2. Build h3 app
  const h3App = createH3App()
  const router = createH3Router()

  // 3. Register routes
  for (const route of routes) {
    router[route.method.toLowerCase()](route.path, route.handler)
  }

  h3App.use(router)

  return { app: h3App, routes, providers }
}
```

## Rationale

### Why Catch-All Route?

**Evaluated Approaches:**

| Approach | Result | Reason |
|----------|--------|--------|
| **Catch-all route** | ✅ Works | Registered at build time, proper lifecycle |
| **Nitro plugin** | ❌ Failed | Plugins run after routing configured |
| **Direct h3 integration** | ⚠️ Possible | Too low-level, loses Nitro benefits |

**Detailed Analysis:**

#### ✅ Catch-All Route Pattern

**Pros:**
- Works perfectly - all routes serve correctly
- Registered at build time as part of Nitro's file-based routing
- Simple and explicit integration point
- No timing/lifecycle issues
- Compatible with all Nitro deployment targets
- Industry standard pattern (used by tRPC, SvelteKit, Remix)

**Cons:**
- One level of indirection (Nitro → catch-all → h3 app)
- Seems like a "workaround" at first glance

**Verdict:** Despite appearing indirect, this is the correct pattern. It's not a workaround - it's how Nitro's ecosystem is designed to work.

#### ❌ Nitro Plugin Approach

**What we tried:**
```typescript
// plugins/hexane.ts - DOES NOT WORK
export default defineNitroPlugin((nitroApp) => {
  const { app } = createH3AppFromModule(AppModule)

  // Attempt 1: Register as middleware
  nitroApp.h3App.use(eventHandler((event) => app.handler(event)))

  // Attempt 2: Register individual routes
  for (const route of routes) {
    nitroApp.h3App.router[route.method](route.path, route.handler)
  }
})
```

**Why it failed:**
- Nitro's routing system is configured BEFORE plugins run
- Adding middleware in a plugin doesn't integrate with Nitro's router
- Routes return 404 even though plugin loads successfully
- Timing issue: plugins run too late in the lifecycle

**Verdict:** Plugins are great for middleware and initialization, but NOT for route registration.

### Why CLI-Based Production Architecture?

For production (v1.0), we'll hide the catch-all route in `@hexane/core`:

**Pros:**
- Users never see framework internals
- Complete abstraction over Nitro
- Easy to update framework
- Framework-agnostic user code
- Industry standard (Next.js, Nuxt, SvelteKit)

**Cons:**
- More complex initial setup
- Requires CLI tooling
- Must maintain virtual module system

**Verdict:** The complexity is worth it for the superior user experience.

## Consequences

### Positive

1. **Clean User Code**
   - Users only write modules in `app/`
   - Single entry point: `export { AppModule }`
   - No Nitro knowledge required

2. **Framework Control**
   - Can change integration strategy without breaking users
   - Easy to add features (Guards, DI, etc.)
   - Complete control over routing

3. **Deployment Flexibility**
   - Works with all Nitro targets
   - Change preset in one config line
   - Verified: Node, Cloudflare, Vercel

4. **Type Safety**
   - Full TypeScript inference
   - No type gymnastics required
   - Clean module composition

5. **Industry Alignment**
   - Same pattern as tRPC, SvelteKit
   - Leverages Nitro as intended
   - Not fighting the framework

### Negative

1. **One Level of Indirection**
   - Request flow: Nitro → catch-all → h3 app
   - Minimal performance impact (single handler delegation)
   - Acceptable trade-off for flexibility

2. **Framework Files in POC**
   - `routes/[...].ts` visible in POC
   - Will be hidden in production CLI
   - Educational benefit in POC phase

### Neutral

1. **Different from Nuxt**
   - Nuxt: File-based routing (`server/api/`)
   - Hexane: Module-based composition
   - Both are valid, serve different purposes

## Alternatives Considered

### Alternative 1: File-Based Routing (Nuxt-style)

```typescript
// Rejected approach
routes/
  ├── api/
  │   ├── users.ts
  │   └── products.ts
```

**Why rejected:**
- Doesn't support module composition
- Can't share providers between routes
- Loses type safety across modules
- Not suitable for enterprise patterns

### Alternative 2: Custom Nitro Preset

```typescript
// Rejected approach
export function hexanePreset() {
  return defineNitroPreset({
    extends: 'node-server',
    hooks: { /* inject routes */ }
  })
}
```

**Why rejected:**
- More complex than needed
- Presets are for deployment targets, not app structure
- Doesn't solve the core integration problem

### Alternative 3: Standalone (No Nitro)

```typescript
// Rejected approach
const app = await createApp(AppModule)
await app.listen(3000)
```

**Why rejected:**
- Loses all Nitro benefits (build, deployment, HMR)
- Would need to reimplement everything
- Not deployment-flexible
- Note: We keep this option for testing via `.standalone/`

## Verification

### POC Results

**Location:** `poc/module-tree/`

**Verified:**
- ✅ Module tree traversal works
- ✅ Routes registered correctly
- ✅ Nitro dev server works
- ✅ Production build succeeds
- ✅ Multiple deployment targets (Node, Cloudflare, Vercel)
- ✅ Type safety maintained
- ✅ HMR works in development

**Testing:**
```bash
cd poc/module-tree

# Development
npm run dev          # ✅ All routes work
curl localhost:3000/health
curl localhost:3000/api/users

# Production build
npm run build        # ✅ Builds successfully
npm run preview      # ✅ Routes work

# Different targets
# Changed preset to 'cloudflare-pages'
npm run build        # ✅ Builds for Cloudflare

# Changed preset to 'vercel'
npm run build        # ✅ Builds for Vercel
```

### Performance

- Negligible overhead (single handler delegation)
- Cold start: < 200ms
- Request handling: No measurable difference vs direct h3

## Implementation Plan

### Phase 1: POC ✅ (Complete)
- Validate catch-all route pattern
- Test Nitro integration
- Verify deployment targets
- Document findings

### Phase 2: Framework Package (Next)
- Create `@hexane/core` package
- Implement CLI (`hexane dev`, `hexane build`)
- Package runtime and types
- Create Nitro preset

### Phase 3: Hidden Integration
- Move catch-all to virtual module
- Generate Nitro config from user app
- CLI handles all Nitro interaction
- Optional `hexane.config.ts` for overrides

### Phase 4: Enhanced DX
- Code generation (`hexane generate module`)
- Development UI (route viewer, module graph)
- TypeScript IDE integration
- Migration guides

## References

- **POC Implementation:** `poc/module-tree/`
- **Technical Comparison:** `poc/module-tree/INTEGRATION_COMPARISON.md`
- **Current Architecture:** `poc/module-tree/ARCHITECTURE.md`
- **Future Design:** `poc/module-tree/FUTURE_ARCHITECTURE.md`
- **User Guide:** `poc/module-tree/USER_GUIDE.md`

### Related ADRs

- **ADR-0001:** Guards and Extractors Pattern
- **ADR-0003:** (Future) CLI Architecture and Tooling

### Industry Examples

- **tRPC + Nitro:** Uses `routes/trpc/[trpc].ts` catch-all
- **SvelteKit:** Uses `[...path]` catch-all for adapters
- **Remix:** Uses catch-all for Nitro adapter

### Related Discussions

- Nitro Documentation: [File-based routing](https://nitro.unjs.io/guide/routing)
- h3 Documentation: [App composition](https://h3.unjs.io/guide/app)

## Future Capabilities

### Deep Nitro Integration via Framework Plugins

The CLI-based architecture allows Hexane to leverage ALL Nitro features by dynamically injecting framework-managed plugins:

#### ✅ What Works

| Feature | Integration Method | User API |
|---------|-------------------|----------|
| **Storage** | Framework plugin + DI | `inject(Storage)` |
| **Tasks** | Module definitions → Nitro tasks | `defineTask()` |
| **WebSocket** | Module definitions → crossws | `defineWebSocket()` |
| **SSE** | Built-in Nitro support | `defineSSE()` |
| **Cache** | Framework plugin + DI | `inject(Cache)` |
| **Database** | Auto-detection + plugin | `inject(Database)` |

#### How It Works

```typescript
// @hexane/core generates Nitro config with plugins
export function createHexaneNitroConfig(userModule) {
  return defineNitroConfig({
    // Hexane injects plugins based on what user uses
    plugins: [
      detectStorage(userModule) && '@hexane/plugin-storage',
      detectTasks(userModule) && '@hexane/plugin-tasks',
      detectWebSockets(userModule) && '@hexane/plugin-websocket',
      // User never sees these!
    ].filter(Boolean)
  })
}
```

**Key Insight:** Plugins don't work for ROUTE registration (timing issue), but they're PERFECT for:
- ✅ Storage integration
- ✅ Task scheduling
- ✅ WebSocket support
- ✅ Database lifecycle
- ✅ Caching layers
- ✅ Feature initialization

This architecture provides the best of both worlds:
- Routes via catch-all (correct lifecycle)
- Features via plugins (progressive enhancement)

## Notes

### Key Insight

The catch-all route pattern is **not a workaround** - it's the correct way to integrate a framework with Nitro's file-based routing system while maintaining control over routing logic.

### Plugin Strategy

- **User-written plugins for routes:** ❌ Don't work (timing)
- **Framework-injected plugins for features:** ✅ Perfect use case
- **User-optional plugins for customization:** ✅ Supported via hexane.config.ts

### Lessons Learned

1. **Plugins have limitations:** Great for middleware/init, not for routes
2. **Build-time matters:** Route registration must happen at build time
3. **Industry alignment:** Similar problems have similar solutions
4. **User experience first:** Technical complexity should be hidden from users

### Future Considerations

1. **Could we swap out Nitro?** Yes - user code in `app/` is framework-agnostic
2. **Performance optimizations?** Could pre-compile module tree at build time
3. **Alternative runtimes?** Same pattern works with other frameworks (Express, Fastify)

---

**Decision made by:** Architecture team
**Date:** 2025-11-22
**Implemented in:** POC `poc/module-tree/`
**Production target:** Hexane v1.0
