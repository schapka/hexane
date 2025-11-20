# ADR-0001: Guards and Extractors Pattern

**Status**: Accepted

**Date**: 2025-11-20

**Deciders**: Core Team

**Related**: POC at `/poc/guards-extractors/`

## Context

Hexane needs a foundational pattern for handling HTTP request processing that:

1. **Separates concerns** between validation and data extraction
2. **Provides type safety** without experimental JavaScript features
3. **Remains explicit** about what each route handler needs
4. **Supports edge runtimes** without Node.js-specific APIs
5. **Scales from simple to complex** use cases

Traditional approaches have limitations:

- **Generic middleware** (Express/Koa): Everything is middleware, blurring the distinction between validation, data extraction, and side effects
- **Decorator-based** (NestJS): Requires experimental decorators, uses reflection (not edge-compatible)
- **Parameter injection** (Fastify): Still treats everything uniformly, less clear separation of concerns

We need a pattern that makes the intent and flow of request processing explicit and type-safe.

## Decision

We adopt the **Guards and Extractors Pattern**, establishing two distinct types of request processing components:

### Guards

**Purpose**: Validate or check conditions without extracting typed values

**Characteristics**:
- Return boolean or throw error
- Don't contribute to handler parameters
- Used for authentication checks, rate limiting, authorization, maintenance mode checks

**Examples**:
```typescript
.rateLimit({ max: 100 })     // Check rate limit
.requireAuth()                // Verify authentication exists
.requireRole('admin')         // Verify user has role
.guard(checkMaintenance())    // Custom guard
```

### Extractors

**Purpose**: Extract and validate typed data from HTTP requests

**Characteristics**:
- Return typed values
- Contribute to handler parameters
- Used for body, params, query, auth user, headers, custom data

**Examples**:
```typescript
.body<CreateUserDto>(schema)  // Extract & validate body
.params<{ id: string }>()     // Extract route params
.query<PaginationQuery>()     // Extract query string
.auth<User>()                 // Extract authenticated user
.extract<string>(getIp())     // Custom extractor
```

### Clear Separation

The key distinction:

- **Guards ask**: "Can this request proceed?" → Yes/No (throw if no)
- **Extractors ask**: "What data do I need?" → Typed value

This separation makes request processing explicit:

```typescript
route()
  // Guards: validation/checks
  .rateLimit({ max: 100 })
  .requireAuth()

  // Extractors: data collection
  .body(UserSchema)
  .auth()

  // Handler: business logic with extracted data only
  .handle(async (body, user) => {
    return createUser(body, user);
  })
```

## Consequences

### Positive

1. **Clear Intent**: Reading a route definition immediately shows what checks happen and what data is extracted

2. **Type Safety**: Handler parameters are automatically inferred from extractors, catching errors at compile time

3. **No Magic**: Explicit about everything - no hidden dependencies, no reflection needed

4. **Composable**: Guards and extractors can be mixed, matched, and reordered as needed

5. **Testable**: Guards and extractors are pure functions, easy to unit test

6. **Edge Compatible**: No Node-specific APIs or reflection required

7. **Self-Documenting**: The distinction guides developers - "Am I checking something or extracting data?"

### Negative

1. **Learning Curve**: Developers must understand the guard vs extractor distinction (though it's intuitive once explained)

2. **Verbosity**: More explicit than implicit patterns - you must declare what you extract

3. **Convention Required**: Need clear guidelines on when to use guards vs extractors (though the distinction is usually clear)

### Neutral

1. **Not a Silver Bullet**: Complex authorization logic might still need custom implementation

2. **Parameter Order Matters**: Extractor order determines handler parameter order (by design, but requires consistency)

## Alternatives Considered

### Alternative 1: Single "Middleware" Concept

**Approach**: Treat everything uniformly as middleware

```typescript
route()
  .use(rateLimit())
  .use(parseBody())
  .use(extractUser())
  .handle(async (event) => {
    // Access event.body, event.user, etc.
  })
```

**Rejected because**:
- No distinction between validation and extraction
- No type safety for extracted values
- Handler signature doesn't reflect dependencies
- Less explicit about what's available

### Alternative 2: Decorator-Based

**Approach**: Use decorators for validation and extraction

```typescript
@Post('/users')
@RateLimit({ max: 100 })
@RequireAuth()
async handle(
  @Body() body: CreateUserDto,
  @Auth() user: User
) {}
```

**Rejected because**:
- Requires experimental decorator support
- Uses reflection (not edge-compatible)
- Less readable (scattered across method and parameters)
- Not part of JavaScript standard

### Alternative 3: Function Composition

**Approach**: Compose functions that process requests

```typescript
const handler = compose(
  rateLimit({ max: 100 }),
  requireAuth(),
  extractBody(schema),
  extractAuth(),
  (body, user) => createUser(body, user)
);
```

**Rejected because**:
- Type inference is harder
- Less readable than method chaining
- No clear distinction between guards and extractors
- Error handling is less clear

## Implementation Notes

This ADR establishes the **conceptual pattern** only. Implementation details (fluent API, method names, type inference) are left to future ADRs.

Key implementation considerations for future:
- How to implement the fluent API (ADR-0002)
- Type inference strategy (ADR-0003)
- Extension points for custom guards/extractors (ADR-0004)
- Error handling approach (ADR-0005)
- Interceptor pattern for response transformation (ADR-0006)

## References

- **Inspiration**: Axum (Rust) - Extractors pattern
- **POC**: `/poc/guards-extractors/` - Validates feasibility
- **Context**: `.ai/context.md` - Framework design principles

## Examples

### Simple Route: Only Extractors

```typescript
route()
  .body(CreateUserSchema)
  .handle(async (body) => {
    return await userService.create(body);
  })
```

### Protected Route: Guards + Extractors

```typescript
route()
  .requireAuth()
  .requireRole('admin')
  .params({ id: z.string().uuid() })
  .body(UpdateUserSchema)
  .auth()
  .handle(async (params, body, user) => {
    return await userService.update(params.id, body);
  })
```

### Public Route: Only Guards

```typescript
route()
  .rateLimit({ max: 1000 })
  .handle(async () => {
    return { message: 'Hello, World!' };
  })
```

### Complex Route: Guards, Extractors, Custom Logic

```typescript
route()
  .rateLimit({ max: 50 })
  .guard(checkMaintenanceMode())
  .requireAuth()
  .params(ParamsSchema)
  .query(QuerySchema)
  .body(DataSchema)
  .auth()
  .extract(clientIpExtractor())
  .handle(async (params, query, body, user, clientIp) => {
    return await processRequest(params, query, body, user, clientIp);
  })
```

## Decision Rationale

The Guards and Extractors pattern provides the best balance of:
- **Explicitness**: Clear what each route does
- **Type Safety**: Full compile-time checking
- **Standards Compliance**: No experimental features
- **Developer Experience**: Intuitive and readable
- **Edge Compatibility**: No runtime limitations

This pattern aligns with Hexane's core principles:
- No experimental decorators ✅
- Standards-first ✅
- Type-safety without magic ✅
- Edge-first ✅
- Zero-config with escape hatches ✅

The POC at `/poc/guards-extractors/` validates that this pattern works excellently with TypeScript's type system and provides the developer experience we want.

---

**Next ADRs**:
- ADR-0002: Fluent API Implementation
- ADR-0003: Handler Parameter Type Inference
- ADR-0004: Custom Extension Points
