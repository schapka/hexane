# ADR-0003: Module System and Circular Dependencies

## Status

**Accepted** - 2025-11-22

Related to: ADR-0002 (Nitro Integration Strategy)

## Context

Hexane's module system is inspired by NestJS, which itself was inspired by Angular's NgModule system. However, both Angular and NestJS suffer from circular dependency problems that create developer friction and runtime errors.

### The Angular/NestJS Problem

```typescript
// users.module.ts
@Module({
  imports: [OrdersModule], // Users needs Orders
  providers: [UserService],
})
export class UsersModule {}

// orders.module.ts
@Module({
  imports: [UsersModule], // Orders needs Users
  providers: [OrderService],
})
export class OrdersModule {}

// Runtime Error: Cannot resolve circular dependency!
// Workaround: forwardRef(() => OrdersModule) // Ugly, error-prone
```

### Why This Happens

**Root cause:** Module imports happen at JavaScript execution time, creating actual circular references in the module system:

```typescript
import { OrdersModule } from './orders'  // Loads orders.ts
└─> import { UsersModule } from './users'  // Loads users.ts
    └─> import { OrdersModule } from './orders'  // ⚠️ CYCLE!
```

### Why It's Common

Real-world domains are interconnected:

- Users have Orders → UsersModule needs OrderService
- Orders belong to Users → OrdersModule needs UserService
- Products have Reviews → ProductsModule needs ReviewService
- Reviews reference Products → ReviewsModule needs ProductService

This is **not bad architecture** - it's **reality**. The module system should handle it gracefully.

### Angular's Evolution

Angular moved toward standalone components partly because:

1. Circular dependencies were too common
2. `forwardRef()` workarounds were confusing
3. Module boundaries felt artificial for component composition

**However:** Angular's problems were frontend-specific (1000s of components). Backend APIs have different constraints (dozens of feature modules).

### NestJS Position

NestJS kept modules despite Angular's shift because:

- Feature boundaries make sense for backend
- Enterprise architecture benefits from explicit modules
- But **inherited the circular dependency problem**

### Requirements for Hexane

1. **Support interconnected domains** - Real business logic needs cross-module dependencies
2. **Avoid runtime crashes** - No surprises in production
3. **Clean syntax** - No ugly workarounds like `forwardRef()`
4. **Early detection** - Catch issues at build time, not runtime
5. **Multiple solutions** - Different patterns for different needs
6. **Better than NestJS** - Learn from Angular's pain points

## Decision

Hexane will **embrace modules** while **solving circular dependencies** through:

1. **Primary Strategy: Service-Level DI** - Dependencies at service level, not module level
2. **Fallback: Lazy Module Resolution** - Function references break cycles when needed
3. **Build-Time Detection** - Warn developers about cycles early
4. **Event-Driven Patterns** - First-class event system for decoupling
5. **Clear Best Practices** - Documentation and tooling guide developers

### Architecture

```
Module System Layers:

┌─────────────────────────────────────┐
│   Module Graph (Build Time)         │
│   - Imports resolved once           │
│   - Cycles detected early           │
│   - Lazy refs supported             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   DI Container (Runtime)            │
│   - Services injected lazily        │
│   - Cycles handled gracefully       │
│   - Cross-module injection          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Event Bus (Async)                 │
│   - Fully decoupled                 │
│   - No direct dependencies          │
│   - Natural for domain events       │
└─────────────────────────────────────┘
```

## Implementation

### 1. Service-Level DI (Primary Solution) ⭐

**Principle:** Modules don't import each other for service dependencies. Services use DI.

```typescript
// users.module.ts
export const UsersModule = defineModule({
  name: "users",
  routes: [userRoutes],
  providers: [UserService],
  // NO module imports needed for service dependencies!
});

// users.service.ts
class UserService {
  constructor(
    // Inject service directly, not via module import
    private orders = inject(OrderService) // ✅ No circular dependency!
  ) {}

  async getUserOrders(userId: string) {
    return this.orders.findByUser(userId);
  }
}

// orders.module.ts
export const OrdersModule = defineModule({
  name: "orders",
  routes: [orderRoutes],
  providers: [OrderService],
  // Also no imports!
});

// orders.service.ts
class OrderService {
  constructor(
    private users = inject(UserService) // ✅ Also fine!
  ) {}

  async createOrder(order: CreateOrder) {
    const user = await this.users.findById(order.userId);
    // Validate user, create order, etc.
  }
}
```

**Why this works:**

- Module imports happen at **definition time** (synchronous)
- Service injection happens at **runtime** (lazy)
- No circular dependency because services resolved via DI container
- DI container handles cycles gracefully

**Trade-offs:**

- ✅ Clean syntax
- ✅ No runtime crashes
- ✅ Natural for services
- ⚠️ Requires global DI container
- ⚠️ All providers must be registered

### 2. Lazy Module Resolution (Fallback)

**When you DO need module imports** (routes, middleware, config):

```typescript
// users.module.ts
export const UsersModule = defineModule({
  imports: [
    CommonModule, // Eager (no cycle risk)
    () => OrdersModule, // Lazy (breaks cycles)
  ],
  routes: [userRoutes],
  providers: [UserService],
});

// orders.module.ts
export const OrdersModule = defineModule({
  imports: [
    CommonModule,
    () => UsersModule, // Also lazy
  ],
  routes: [orderRoutes],
  providers: [OrderService],
});
```

**Implementation:**

```typescript
// core.ts
export type ModuleImport = ModuleDefinition | (() => ModuleDefinition);

function traverseModule(
  module: ModuleDefinition,
  visited = new Set<ModuleDefinition>()
) {
  if (visited.has(module)) {
    return; // Already processed
  }
  visited.add(module);

  if (module.imports) {
    for (const imported of module.imports) {
      // Handle lazy module references
      const resolvedModule =
        typeof imported === "function"
          ? imported() // Call function to get module
          : imported;

      traverseModule(resolvedModule, visited);
    }
  }

  // Collect routes, providers, etc.
}
```

**Trade-offs:**

- ✅ Works for route/middleware dependencies
- ✅ Explicit (developer knows there's a cycle)
- ⚠️ Extra syntax (function wrapper)
- ⚠️ Evaluated every traversal (minor overhead)

### 3. Build-Time Cycle Detection

```typescript
// core.ts
function traverseModule(
  module: ModuleDefinition,
  visited = new Set<ModuleDefinition>(),
  stack: ModuleDefinition[] = []
) {
  // Check for cycles
  if (stack.includes(module)) {
    const cycle = [...stack, module]
      .map((m) => m.name || "unnamed")
      .join(" → ");

    console.warn(
      `⚠️  Circular dependency detected:\n` +
        `   ${cycle}\n\n` +
        `💡 Solutions:\n` +
        `   1. Use service-level DI instead of module imports\n` +
        `   2. Use lazy imports: imports: [() => Module]\n` +
        `   3. Extract shared code to CommonModule\n` +
        `   4. Use event-driven patterns for decoupling\n`
    );

    // In strict mode, could throw
    if (process.env.HEXANE_STRICT_CYCLES === "true") {
      throw new Error(`Circular dependency: ${cycle}`);
    }

    return;
  }

  stack.push(module);
  // ... traverse
  stack.pop();
}
```

**CLI Command:**

```bash
hexane check:cycles

# Output:
✓ No circular dependencies detected

# Or:
⚠️  Found 2 circular dependencies:

1. UsersModule → OrdersModule → UsersModule
   Location: app/modules/users/users.module.ts

   Suggestion: OrderService can be injected directly in UserService
   without importing OrdersModule

2. ProductsModule → ReviewsModule → ProductsModule
   Location: app/modules/products/products.module.ts

   Suggestion: Use lazy import: () => ReviewsModule
```

**Trade-offs:**

- ✅ Early detection
- ✅ Helpful suggestions
- ✅ Can be part of CI/CD
- ⚠️ Requires AST analysis or runtime tracking

### 4. Event-Driven Decoupling

```typescript
// orders.service.ts - No direct UserService dependency
class OrderService {
  constructor(private events = inject(EventBus)) {}

  async createOrder(order: CreateOrder) {
    const newOrder = await this.db.orders.create(order);

    // Emit event instead of calling UserService
    await this.events.emit("order.created", {
      orderId: newOrder.id,
      userId: order.userId,
      total: order.total,
    });

    return newOrder;
  }
}

// users.service.ts - Listen to events
class UserService {
  constructor(private events = inject(EventBus)) {
    // React to order events
    this.events.on("order.created", this.handleOrderCreated.bind(this));
  }

  private async handleOrderCreated(event: OrderCreatedEvent) {
    // Update user's order count, lifetime value, etc.
    await this.db.users.update(event.userId, {
      orderCount: { increment: 1 },
      lifetimeValue: { increment: event.total },
    });
  }
}
```

**Trade-offs:**

- ✅ Fully decoupled
- ✅ Natural for domain events
- ✅ Scalable (can add listeners without touching emitter)
- ⚠️ Less explicit (harder to trace call flow)
- ⚠️ Async only (no return values)

## Best Practices

### When to Use Each Pattern

| Scenario                             | Solution      | Example                        |
| ------------------------------------ | ------------- | ------------------------------ |
| **Service needs another service**    | DI injection  | `inject(OrderService)`         |
| **Module needs routes from another** | Lazy import   | `() => OrdersModule`           |
| **Domain event notification**        | Event bus     | `events.emit('order.created')` |
| **Shared utilities**                 | Common module | `imports: [CommonModule]`      |

### Module Import Guidelines

```typescript
// ✅ GOOD: Use imports for
export const UsersModule = defineModule({
  imports: [
    CommonModule, // Shared utilities
    AuthModule, // Middleware/guards
    () => OrdersModule, // Routes (if needed, lazy)
  ],
});

// ❌ AVOID: Importing just for services
export const UsersModule = defineModule({
  imports: [OrdersModule], // Just to use OrderService
});

// ✅ BETTER: Use DI in services
class UserService {
  constructor(private orders = inject(OrderService)) {}
}
```

### Service Dependency Guidelines

```typescript
// ✅ GOOD: Direct injection
class UserService {
  constructor(
    private orders = inject(OrderService),
    private payments = inject(PaymentService)
  ) {}
}

// ✅ GOOD: Event-driven for side effects
class OrderService {
  async create(order: CreateOrder) {
    const result = await this.db.create(order);
    await this.events.emit("order.created", result);
    return result;
  }
}

// ❌ AVOID: Reaching through modules
class UserService {
  constructor(
    private ordersModule = inject(OrdersModule) // Don't inject modules!
  ) {}

  async getOrders() {
    return this.ordersModule.services.orders.find(); // Bad!
  }
}
```

## Comparison with Other Frameworks

| Framework   | Circular Handling | DX           | Solution Quality       |
| ----------- | ----------------- | ------------ | ---------------------- |
| **Angular** | forwardRef()      | ⚠️ Confusing | Workaround             |
| **NestJS**  | forwardRef()      | ⚠️ Confusing | Inherited from Angular |
| **Hexane**  | Multiple patterns | ✅ Clean     | First-class support    |

### Angular/NestJS

```typescript
// Ugly workaround
@Module({
  imports: [forwardRef(() => OrdersModule)], // 🤮
})
export class UsersModule {}
```

### Hexane

```typescript
// Clean options
export const UsersModule = defineModule({
  imports: [() => OrdersModule], // ✅ Clear intent
  providers: [UserService],
});

// Or better: no import needed
class UserService {
  constructor(private orders = inject(OrderService)) {} // ✅
}
```

## Consequences

### Positive

1. **Better DX than NestJS**

   - No `forwardRef()` hacks
   - Clear, explicit solutions
   - Multiple patterns for different needs

2. **Fewer Runtime Errors**

   - Build-time detection
   - Graceful DI resolution
   - Clear error messages

3. **More Flexible Architecture**

   - Service-level DI natural for business logic
   - Event-driven decoupling for domain events
   - Module imports only when truly needed

4. **Better Documentation**

   - Clear guidelines when to use each pattern
   - Examples for common scenarios
   - Tooling to help developers

5. **Competitive Advantage**
   - Key differentiator from NestJS
   - Addresses major pain point
   - Demonstrates framework maturity

### Negative

1. **Multiple Solutions → Cognitive Load**

   - Developers need to learn when to use each
   - Mitigated by: Clear documentation, CLI guidance

2. **Global DI Container**

   - Services can access any other service
   - Need clear scoping rules
   - Mitigated by: Module-level provider registration

3. **Implementation Complexity**
   - Lazy resolution adds code complexity
   - Cycle detection needs maintenance
   - Mitigated by: Well-tested core implementation

### Neutral

1. **Different from NestJS**
   - Migrants need to learn new patterns
   - But patterns are simpler
   - Migration guide will help

## Implementation Plan

### Phase 1: Core Support (v0.1.0)

- [ ] Implement lazy module resolution
- [ ] Basic cycle detection in dev mode
- [ ] DI container with cross-module injection
- [ ] Documentation and examples

### Phase 2: Enhanced Detection (v0.2.0)

- [ ] Build-time cycle analysis
- [ ] CLI `hexane check:cycles` command
- [ ] Helpful error messages with suggestions
- [ ] CI/CD integration guide

### Phase 3: Event System (v0.3.0)

- [ ] Built-in event bus
- [ ] Type-safe event definitions
- [ ] Event listener registration
- [ ] Documentation and patterns

### Phase 4: Tooling (v0.4.0)

- [ ] VSCode extension warnings
- [ ] Module dependency graph visualization
- [ ] Auto-fix suggestions
- [ ] Migration guide from NestJS

## References

### Related ADRs

- **ADR-0001:** Guards and Extractors Pattern
- **ADR-0002:** Nitro Integration Strategy
- **ADR-0004:** (Future) Dependency Injection Container Design

### External References

- [Angular Circular Dependency Issues](https://github.com/angular/angular/issues?q=circular+dependency)
- [NestJS forwardRef() Documentation](https://docs.nestjs.com/fundamentals/circular-dependency)
- [Angular's Move to Standalone Components](https://angular.io/guide/standalone-components)

### Internal Documentation

- Module System Design: `poc/module-tree/`
- User Guide: `poc/module-tree/USER_GUIDE.md`
- Architecture: `poc/module-tree/ARCHITECTURE.md`

## Notes

### Key Insight

**The problem isn't modules** - it's how dependencies are expressed. Separating **module composition** (structural) from **service dependencies** (runtime) elegantly solves circular dependency issues.

### Why This Matters

Circular dependencies were one of Angular's **biggest pain points** and a major reason for their architectural shift. By solving this cleanly, Hexane can:

1. Keep the benefits of modules (feature boundaries, enterprise architecture)
2. Avoid the problems of modules (circular dependencies, forwardRef hacks)
3. Provide better DX than NestJS (key competitive advantage)

### Future Considerations

1. **Automatic detection in IDE** - TypeScript language service plugin
2. **Dependency graph visualization** - Dev UI showing module relationships
3. **Auto-refactoring** - Suggest extracting shared modules
4. **Performance optimization** - Cache resolved module graphs

---

**Decision made by:** Core team
**Date:** 2025-11-22
**Status:** Accepted
**Next Review:** After v0.2.0 implementation
