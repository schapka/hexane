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

1. **No Experimental Decorators**: Use standard JavaScript/TypeScript features only
2. **Standards-First**: Embrace Standard Schema, web standards, ECMAScript standards
3. **Zero-Config with Escape Hatches**: Auto-detect and configure, but allow overrides
4. **Type-Safety Without Magic**: Full TypeScript support with inference
5. **Edge-First**: Lightweight, tree-shakeable, no Node-specific dependencies in core

## Key Patterns to Implement

### 1. Auto-Configuration (Spring Boot Inspired)

```typescript
// Automatically detect and configure based on installed packages
if (packageExists("drizzle-orm")) {
  autoConfigureDatabase();
}
```

### 2. Extractor Pattern (Axum Inspired)

```typescript
// Type-safe request data extraction without decorators
handler(
  new Path(ParamsSchema),
  new Body(UserSchema),
  new Auth<User>()
)(async (params, body, user) => {
  // Fully typed and validated
});
```

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

- **Router**: Enhanced h3 router with extractors
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

- ✅ Type-safe APIs without decorators
- ✅ Auto-configured services based on environment
- ✅ Composable middleware using extractors
- ✅ Standards-compliant code
- ✅ Edge-deployable applications

### What We Avoid

- ❌ Experimental decorators
- ❌ Runtime type checking in production
- ❌ Node-specific APIs in core
- ❌ Complex build pipelines
- ❌ Framework lock-in

## Example Code Patterns

### Route Handler

```typescript
export default defineRouter().get(
  "/users/:id",
  handler(
    new Path({ id: z.string().uuid() }),
    new Query<{ include?: string }>(),
    new Auth<User>()
  )(async (params, query, user) => {
    if (!user) throw unauthorized();
    return await userService.findById(params.id);
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

### In Progress

- [ ] Proof of concept for extractors
- [ ] Proof of concept for DI container
- [ ] Proof of concept for auto-configuration

### Upcoming

- [ ] Core router implementation
- [ ] Standard Schema integration
- [ ] Module system
- [ ] CLI tooling

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

- **Extractor**: Function that extracts and validates data from HTTP requests
- **Auto-Configuration**: Automatic setup based on detected packages
- **Standard Schema**: Unified interface for validation libraries
- **Edge Runtime**: JavaScript runtime for edge computing (Workers, Deno Deploy)
- **DI**: Dependency Injection
- **ADR**: Architecture Decision Record

## References

- [Nitro Documentation](https://nitro.unjs.io)
- [H3 Documentation](https://h3.unjs.io)
- [Standard Schema Spec](https://github.com/standard-schema/standard-schema)
- [Project Repository](https://github.com/[username]/hexane)

## AI Assistant Notes

When helping with Hexane:

1. Always avoid experimental decorators
2. Prefer composition over inheritance
3. Use Standard Schema for validation
4. Consider edge compatibility
5. Maintain type safety
6. Follow the extractor pattern for request handling
7. Use parameter-based DI, not property injection
8. Auto-configure when possible

Remember: We're building for the future of JavaScript, not maintaining compatibility with legacy patterns.
