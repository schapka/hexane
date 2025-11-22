# Hexane Framework - AI Assistant Context

> This document provides comprehensive context for AI assistants helping with the Hexane framework development.

## Project Overview

**Hexane** is an enterprise-ready backend framework built on top of UnJS's nitro/h3. It brings mature enterprise patterns to the modern edge-compatible runtime without relying on experimental JavaScript features like decorators.

### Mission

Create a framework that combines Nitro's deployment flexibility with enterprise patterns from NestJS, Spring Boot, and other mature frameworks, while maintaining standards compliance and excellent developer experience.

### Current Status

- **Phase**: Architecture & Design
- **Stage**: Pre-implementation
- **Focus**: Establishing patterns, creating proofs of concept

## Technical Context

### Foundation

- **Runtime**: Nitro (UnJS)
- **HTTP Layer**: h3 (UnJS)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
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
if (packageExists("drizzle-orm")) {
  autoConfigureDatabase();
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
  "/users",
  route()
    .rateLimit({ max: 100 }) // Guard - no value extracted
    .validateApiKey() // Guard - no value extracted
    .body(UserSchema) // Extractor - adds body to params
    .auth() // Extractor - adds user to params
    .handle(async (body, user) => {
      // Only extracted values as params!
      return createUser(body, user);
    })
);
```

**Key Benefits:**

- Clear separation between validation (guards) and data extraction (extractors)
- Type-safe: handler signature automatically inferred from extractors
- Readable: intent is clear from the chain
- Composable: easy to reorder or add new guards/extractors

### 3. Parameter-Based DI (FastAPI Inspired)

```typescript
// Dependencies via function parameters
async function handler(
  userService = Depends(() => inject(UserService)),
  logger = Depends(getLogger)
) {
  // Dependencies injected at runtime
}
```

### 4. Standard Schema Integration

```typescript
// Support any validator (Zod, Valibot, Arktype)
import { z } from "zod"; // or valibot, or arktype

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});
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
  "/users/:id",
  route()
    .rateLimit({ max: 50 })
    .requireAuth() // Guard - checks auth exists
    .params({ id: z.string().uuid() }) // Extractor - typed params
    .query<{ include?: string }>() // Extractor - typed query
    .auth<User>() // Extractor - user object
    .handle(async (params, query, user) => {
      // Fully typed!
      return await userService.findById(params.id, query.include);
    })
);
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
    const user = await this.db.users.create(data);
    await this.events.emit("user:created", user);
    return user;
  }
}
```

### Module Definition

```typescript
export const usersModule = defineModule({
  name: "users",
  imports: [CommonModule],
  routes: userRoutes,
  providers: [UserService, UserRepository],
  exports: [UserService],
});
```

## Implementation Status

### Completed

- [x] Framework vision and goals
- [x] Core pattern identification
- [x] Architecture documentation
- [x] Guard/Extractor fluent API design decision
- [x] POC for Guards & Extractors pattern
- [x] ADR-0001: Guards and Extractors Pattern
- [x] POC for Module Tree & Nitro Integration
- [x] ADR-0002: Nitro Integration Strategy
- [x] Verified deployment to multiple targets (Node, Cloudflare, Vercel)
- [x] Future architecture design (CLI-based invisible abstraction)

### In Progress

- [ ] Packaging as @hexane/core
- [ ] CLI implementation (hexane dev/build/start)

### Upcoming

- [ ] ADR-0003: CLI Architecture and Tooling
- [ ] ADR-0004: Fluent API Implementation
- [ ] ADR-0005: Handler Parameter Type Inference
- [ ] Core router implementation with Guards & Extractors
- [ ] DI container
- [ ] Standard Schema integration
- [ ] Auto-configuration
- [ ] Code generation tooling

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

## Nitro Integration Pattern

Hexane abstracts Nitro completely, providing a clean user experience:

### Current (POC)

```typescript
// routes/[...].ts - Framework internal (users see this in POC)
import { createH3AppFromModule } from "../core";
import { AppModule } from "../app/main";

const { app } = createH3AppFromModule(AppModule);
export default defineEventHandler((event) => app.handler(event));
```

### Future (v1.0)

```typescript
// User's project - NO Nitro files visible
my-app/
├── app/
│   └── main.ts        # export { AppModule }
└── package.json       # "dev": "hexane dev"

// Everything else managed by @hexane/core CLI
```

**Key Decisions:**

- ✅ Use catch-all route pattern (`routes/[...].ts`) - NOT Nitro plugins
- ✅ CLI-based abstraction in production (like Next.js/Nuxt)
- ✅ User code is framework-agnostic (just modules)
- ✅ Works with all Nitro deployment targets

**See:** ADR-0002 for detailed rationale

## References

- [Nitro Documentation](https://nitro.unjs.io)
- [H3 Documentation](https://h3.unjs.io)
- [Standard Schema Spec](https://github.com/standard-schema/standard-schema)
- [ADR-0001: Guards and Extractors Pattern](/docs/architecture/decisions/0001-guards-and-extractors-pattern.md)
- [ADR-0002: Nitro Integration Strategy](/docs/architecture/decisions/0002-nitro-integration-strategy.md)
- [POC: Guards & Extractors](/poc/guards-extractors/)
- [POC: Module Tree & Nitro](/poc/module-tree/)

## AI Assistant Notes

When helping with Hexane:

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

Remember: We're building for the future of JavaScript, not maintaining compatibility with legacy patterns.
