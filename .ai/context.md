# Hexane Framework - AI Assistant Context

> This document provides comprehensive context for AI assistants helping with the Hexane framework development.

## Project Overview

**Hexane** is an enterprise-ready backend framework built on top of UnJS's nitro/h3. It brings mature enterprise patterns to the modern edge-compatible runtime without relying on experimental JavaScript features like decorators.

### Mission

Create a framework that combines Nitro's deployment flexibility with enterprise patterns from NestJS, Spring Boot, and other mature frameworks, while maintaining standards compliance and excellent developer experience.

### Current Status

- **Phase**: Architecture & Initial Implementation
- **Stage**: Foundation setup (packages/core, packages/vite)
- **Focus**: Nitro v3/Vite plugin integration, core runtime implementation
- **Latest Decision**: ADR-0004 - Target Nitro v3 with Vite plugin architecture

## Technical Context

### Foundation

- **Build Tool**: Vite (Hexane as Vite plugin)
- **Runtime**: Nitro v3 (UnJS) - as Vite plugin
- **HTTP Layer**: h3 v2 (UnJS)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm (with workspace catalogs)
- **Deployment Targets**: Edge, Node.js, Deno, Bun, Cloudflare Workers

### Core Design Principles

1. **Decorator-Free Core**: Core design does not depend on experimental decorators (may be added as optional future feature)
2. **Standards-First**: Embrace Standard Schema, web standards, ECMAScript standards
3. **Zero-Config with Escape Hatches**: Auto-detect and configure, but allow overrides
4. **Type-Safety Without Magic**: Full TypeScript support with inference
5. **Edge-First**: Lightweight, tree-shakeable, no Node-specific dependencies in core
6. **Fluent API Design**: Chainable, readable APIs with clear intent

## Key Patterns to Implement

### 1. Auto-Configuration (Spring Boot Inspired)

```typescript
// Automatically detect and configure based on installed packages
if (packageExists('drizzle-orm')) {
  autoConfigureDatabase()
}
```

### 2. Extractors & Guards Pattern (Axum Inspired)

**Two types of route handlers:**

- **Guards**: Validate/check conditions but don't extract values (e.g., rate limiting, API key validation)
- **Extractors**: Extract and validate typed values from requests (e.g., body, params, auth user)

**Fluent API Design:**

```typescript
// Guards first, then extractors, handler gets only extracted values
router.post(
  '/users',
  route()
    .rateLimit({ max: 100 }) // Guard - no value extracted
    .validateApiKey() // Guard - no value extracted
    .body(UserSchema) // Extractor - adds body to params
    .auth() // Extractor - adds user to params
    .handle(async (body, user) => {
      // Only extracted values as params!
      return createUser(body, user)
    })
)
```

**Key Benefits:**

- Clear separation between validation (guards) and data extraction (extractors)
- Type-safe: handler signature automatically inferred from extractors
- Readable: intent is clear from the chain
- Composable: easy to reorder or add new guards/extractors

### 3. Module System (NestJS Inspired, Improved)

**Module-based architecture with circular dependency solutions:**

```typescript
// Module definition - clean, decorator-free
export const UsersModule = defineModule({
  name: 'users',
  imports: [CommonModule], // Shared modules
  routes: [userRoutes], // Route definitions
  providers: [UserService], // Services
  exports: [UserService], // Exportable services
})
```

**Key Improvements Over NestJS:**

- ✅ No decorators required
- ✅ Service-level DI prevents circular dependencies
- ✅ Lazy module imports `() => Module` when needed
- ✅ Build-time cycle detection
- ✅ Event-driven decoupling as alternative

**Circular Dependency Handling:**

```typescript
// ✅ GOOD: Service-level DI (no circular deps)
class UserService {
  constructor(
    private orders = inject(OrderService) // Direct injection
  ) {}
}

// ✅ GOOD: Lazy imports when needed
export const UsersModule = defineModule({
  imports: [
    CommonModule, // Eager
    () => OrdersModule, // Lazy (breaks cycles)
  ],
})

// ❌ AVOID: Module imports for services (causes cycles)
export const UsersModule = defineModule({
  imports: [OrdersModule], // Just to use OrderService - don't do this!
})
```

**See:** ADR-0003 for detailed circular dependency strategy

### 4. Parameter-Based DI (FastAPI Inspired)

```typescript
// Dependencies via function parameters
async function handler(
  userService = Depends(() => inject(UserService)),
  logger = Depends(getLogger)
) {
  // Dependencies injected at runtime
}
```

### 5. Standard Schema Integration

```typescript
// Support any validator (Zod, Valibot, Arktype)
import { z } from 'zod' // or valibot, or arktype

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
})
```

## Architecture Components

### Core Modules

- **Router**: Enhanced h3 router with fluent API
- **Guards**: Validation and checks without value extraction (rate limiting, auth checks)
- **Extractors**: Type-safe data extraction from requests (body, params, query, auth)
- **Route Builder**: Fluent `route()` API for chaining guards and extractors
- **DI Container**: Parameter-based dependency injection
- **Auto-Configuration**: Package detection and setup
- **Validation**: Standard Schema integration
- **Module System**: Organize code into features

### Enterprise Features (Planned)

- Event Bus
- Job Queue abstraction
- Repository pattern
- Health checks & metrics
- OpenAPI generation
- Caching abstraction

## Code Style Guidelines

### What We Build

- ✅ Type-safe APIs with fluent Guard and Extractor chains
- ✅ Auto-configured services based on environment
- ✅ Composable guards (validation) and extractors (data extraction)
- ✅ Standards-compliant code
- ✅ Edge-deployable applications
- ✅ Clear, readable route definitions

### What We Avoid

- ❌ Decorator-dependent core design (decorators may be optional later, but core must work without them)
- ❌ Runtime type checking in production
- ❌ Node-specific APIs in core
- ❌ Complex build pipelines
- ❌ Framework lock-in
- ❌ Implicit behavior or "magic"

## Example Code Patterns

### Route Handler with Guards and Extractors

```typescript
export default defineRouter().get(
  '/users/:id',
  route()
    .rateLimit({ max: 50 })
    .requireAuth() // Guard - checks auth exists
    .params({ id: z.string().uuid() }) // Extractor - typed params
    .query<{ include?: string }>() // Extractor - typed query
    .auth<User>() // Extractor - user object
    .handle(async (params, query, user) => {
      // Fully typed!
      return await userService.findById(params.id, query.include)
    })
)
```

### Service with DI

```typescript
class UserService {
  constructor(
    private db = getDb(),
    private cache = getCache(),
    private events = getEventBus()
  ) {}

  async create(data: CreateUser) {
    const user = await this.db.users.create(data)
    await this.events.emit('user:created', user)
    return user
  }
}
```

### Module Definition

```typescript
export const usersModule = defineModule({
  name: 'users',
  imports: [CommonModule],
  routes: userRoutes,
  providers: [UserService, UserRepository],
  exports: [UserService],
})
```

## Implementation Status

### Completed ✅

- [x] Framework vision and goals
- [x] Core pattern identification
- [x] Architecture documentation
- [x] Guard/Extractor fluent API design decision
- [x] POC for Guards & Extractors pattern
- [x] ADR-0001: Guards and Extractors Pattern
- [x] POC for Module Tree & Nitro v2 Integration
- [x] ADR-0002: Nitro v2 Integration Strategy (insights retained)
- [x] ADR-0003: Module System and Circular Dependencies
- [x] ADR-0004: Nitro v3 and Vite Plugin Architecture ⭐ NEW
- [x] Verified deployment to multiple targets (Node, Cloudflare, Vercel)
- [x] Circular dependency strategy and solutions
- [x] Minimal workspace setup (packages/core, packages/vite scaffolded)

### In Progress 🚧

- [ ] Nitro v3 + Vite plugin POC validation
- [ ] @hexane/core - Runtime implementation
  - [ ] Module system (port from POC)
  - [ ] Decorator metadata collection
  - [ ] DI container with circular dependency support
  - [ ] Route collection and traversal
  - [ ] h3 handler generation
- [ ] @hexane/vite - Vite plugin implementation
  - [ ] Plugin scaffold
  - [ ] Nitro v3 configuration generation
  - [ ] Programmatic handler registration
  - [ ] HMR for module changes

### Upcoming 📋

- [ ] Core router implementation with Guards & Extractors
- [ ] Event bus for decoupled communication
- [ ] Standard Schema integration
- [ ] Auto-configuration
- [ ] Build-time cycle detection tooling
- [ ] Example application with real module tree
- [ ] Production deployment testing
- [ ] Documentation and guides
- [ ] Code generation tooling (when needed)
- [ ] CLI package (if/when needed)

## File Structure Conventions

```
src/
├── modules/          # Feature modules
│   └── users/
│       ├── users.routes.ts
│       ├── users.service.ts
│       └── users.schema.ts
├── core/            # Framework core
├── shared/          # Shared utilities
└── config/          # Configuration
```

## Testing Approach

- **Unit Tests**: Vitest for all core functionality
- **Integration Tests**: Test against real Nitro server
- **E2E Tests**: Test deployment targets
- **Benchmarks**: Compare with h3, Fastify, NestJS

## Dependencies Philosophy

### Core Dependencies (Minimal)

- nitropack
- h3
- @standard-schema/spec
- radix3 (via h3)

### Optional Integrations

Should work with any:

- Validator (Zod, Valibot, Arktype)
- ORM (Drizzle, Prisma)
- Cache (Redis, Memcached)
- Queue (BullMQ, p-queue)

## Common Tasks

### When Adding a New Feature

1. Create proof of concept in `/research/experiments/`
2. Document pattern in `/docs/architecture/patterns/`
3. Create ADR if it's a significant decision
4. Implement in `/packages/core/`
5. Add tests
6. Update this context document

### When Reviewing Code

- Ensure no experimental decorators
- Check for edge compatibility
- Verify type safety
- Confirm Standard Schema usage where applicable
- Look for auto-configuration opportunities

## Glossary

- **Guard**: Validates/checks conditions without extracting values (e.g., rate limiting, authentication checks)
- **Extractor**: Extracts and validates typed data from HTTP requests (e.g., body, params, query, user)
- **Fluent API**: Chainable method calls that read naturally and return self for further chaining
- **Auto-Configuration**: Automatic setup based on detected packages
- **Standard Schema**: Unified interface for validation libraries
- **Edge Runtime**: JavaScript runtime for edge computing (Workers, Deno Deploy)
- **DI**: Dependency Injection
- **ADR**: Architecture Decision Record

## Package Structure

Hexane uses a minimal two-package monorepo structure:

```bash
packages/
├── core/     # @hexane/core - Runtime (modules, DI, decorators, metadata)
└── vite/     # @hexane/vite - Vite plugin (integration with Nitro v3)
```

**No CLI package initially** - Vite handles dev/build commands, production runs Nitro's output directly.

## Nitro v3 Integration Architecture

Hexane is a **Vite plugin** that wraps and configures Nitro v3:

### User Configuration

```typescript
import { hexane } from '@hexane/vite'
// vite.config.ts - Single config file
import { defineConfig } from 'vite'
import { AppModule } from './app/app.module'

export default defineConfig({
  plugins: [
    hexane({
      modules: [AppModule]
    })
  ]
})
```

### Development & Production

```bash
# Development
vite dev                    # Vite + Hexane plugin + Nitro v3

# Build
vite build                  # Generates .output/ via Nitro

# Production
node .output/server/index.mjs  # Run Nitro's output
```

### How It Works

```
┌─────────────────────────┐
│  vite.config.ts         │
│  hexane({ modules })    │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│  @hexane/vite           │
│  - Generate handlers    │
│  - Configure Nitro      │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│  Nitro v3 (Vite plugin) │
│  - handlers: [...]      │
│  - Server lifecycle     │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│  h3 v2                  │
│  - Request handling     │
└─────────────────────────┘
```

**Key Decisions:**

- ✅ Vite plugin architecture (wraps Nitro v3)
- ✅ Programmatic handler registration via `handlers` config
- ✅ No file-based routing workarounds (catch-all routes obsolete)
- ✅ Single config file for users (`vite.config.ts`)
- ✅ No CLI needed (Vite handles dev/build)
- ✅ User code is framework-agnostic (just modules)
- ✅ Works with all Nitro deployment targets

**See:**
- ADR-0004 for Nitro v3 + Vite plugin architecture
- ADR-0002 for Nitro v2 integration insights (catch-all pattern, plugin timing)

## Module System Best Practices

### When to Use Modules

✅ **Use modules for:**

- Multiple related routes (users CRUD)
- Shared services between routes
- Feature can be independently tested
- Team owns a domain area
- Cross-cutting concerns (auth, logging)

❌ **Don't use modules for:**

- Single route/endpoint
- No shared state
- Prototyping/exploring
- Simple utility functions

### Avoiding Circular Dependencies

**Primary Strategy: Service-Level DI**

```typescript
// Services inject other services directly
class UserService {
  constructor(private orders = inject(OrderService)) {}
}

// No module imports needed!
export const UsersModule = defineModule({
  providers: [UserService], // OrderService available via DI
})
```

**Fallback: Lazy Module Imports**

```typescript
export const UsersModule = defineModule({
  imports: [
    CommonModule, // Eager - no cycle risk
    () => OrdersModule, // Lazy - breaks cycles
  ],
})
```

**Alternative: Event-Driven**

```typescript
class OrderService {
  async create(order: CreateOrder) {
    const result = await this.db.create(order)
    await this.events.emit('order.created', result) // Decoupled!
    return result
  }
}
```

**See:** ADR-0003 for comprehensive circular dependency strategy

## References

### Documentation
- [Nitro v3 Documentation](https://v3.nitro.build/docs)
- [H3 Documentation](https://h3.unjs.io)
- [Vite Documentation](https://vitejs.dev)
- [Standard Schema Spec](https://github.com/standard-schema/standard-schema)

### Architecture Decision Records
- [ADR-0001: Guards and Extractors Pattern](/docs/architecture/decisions/0001-guards-and-extractors-pattern.md)
- [ADR-0002: Nitro v2 Integration Strategy](/docs/architecture/decisions/0002-nitro-integration-strategy.md)
- [ADR-0003: Module System and Circular Dependencies](/docs/architecture/decisions/0003-module-system-and-circular-dependencies.md)
- [ADR-0004: Nitro v3 and Vite Plugin Architecture](/docs/architecture/decisions/0004-nitro-v3-vite-plugin-architecture.md) ⭐

### Proofs of Concept
- [POC: Guards & Extractors](/poc/guards-extractors/)
- [POC: Module Tree & Nitro v2](/poc/module-tree/)

## AI Assistant Notes

When helping with Hexane:

### Core Principles

1. Core must work without decorators (decorators may be added as optional future feature)
2. Always use the fluent Guard/Extractor pattern for routes
3. Guards validate/check but don't extract values
4. Extractors provide typed values to handlers
5. Handler parameters should only include extracted values (no event object!)
6. Use Standard Schema for validation
7. Consider edge compatibility in all code
8. Maintain type safety with full inference
9. Use parameter-based DI, not property injection
10. Auto-configure when possible
11. Prefer composition over inheritance
12. Keep APIs readable and chainable

### Module System

13. **Modules are for feature boundaries**, not just code organization
14. **Service dependencies use DI**, not module imports
15. **Avoid circular dependencies** - use service-level injection
16. **Lazy imports when needed**: `() => Module` for cycles
17. **Event-driven for decoupling** - emit events instead of direct calls
18. **Build-time detection** - warn about cycles early

### Architecture (Nitro v3 + Vite Plugin)

19. **Target Nitro v3 and h3 v2** - build on modern foundation
20. **Hexane is a Vite plugin** - wraps and configures Nitro v3
21. **Programmatic handlers** - use Nitro v3's `handlers` config array
22. **No file-based workarounds** - v3 eliminates need for catch-all routes
23. **Single config file** - users only need `vite.config.ts`
24. **No CLI package initially** - Vite handles dev/build
25. **Two packages**: `@hexane/core` (runtime) and `@hexane/vite` (plugin)

### Anti-Patterns to Avoid

- ❌ Using module imports just to access services
- ❌ Creating "god modules" to avoid cycles
- ❌ Importing modules circularly without lazy resolution
- ❌ Tight coupling between domain modules

### Better Approaches

- ✅ Service-level DI: `inject(OrderService)` in UserService
- ✅ Event-driven: `events.emit('order.created')`
- ✅ Lazy imports: `imports: [() => OrdersModule]`
- ✅ Shared modules: Extract common code to CommonModule

### Key Reminders

**Building for the Future**: We're targeting Nitro v3 (alpha) and h3 v2 to build on modern architecture from day one. This avoids technical debt and migration work later. The stability risk is acceptable for a new framework.

**Vite Plugin Strategy**: Hexane wraps Nitro v3 as a Vite plugin. This provides clean integration through programmatic handler registration (no file-based workarounds), single config file UX, and leverages Vite's excellent tooling.

**Start Minimal**: Two packages initially (`@hexane/core` runtime, `@hexane/vite` plugin). No CLI needed - Vite handles dev/build. Add packages organically when real needs emerge.

**Circular Dependencies**: Should be prevented by design (service-level DI), not worked around. We learned from Angular's mistakes.
