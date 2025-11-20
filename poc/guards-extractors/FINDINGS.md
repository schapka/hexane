# POC Findings: Guards & Extractors Fluent API

**Date**: 2025-11-20
**Status**: ✅ Successful - Ready for ADR

## Summary

The Guards & Extractors pattern with fluent API has been successfully validated. TypeScript's type system fully supports the design, providing excellent type inference and developer experience.

## What Was Tested

### 1. Type Inference ✅

**Test**: Can TypeScript infer handler parameters from extractors?

**Result**: Yes, perfectly!

```typescript
route()
  .body<CreateUserDto>(schema)
  .auth<User>()
  .handle(async (body, user) => {
    // ✅ body: CreateUserDto
    // ✅ user: User
    // Full autocomplete and type checking!
  })
```

### 2. Guards Don't Extract ✅

**Test**: Do guards affect the handler signature?

**Result**: No, as designed!

```typescript
route()
  .rateLimit({ max: 100 })
  .requireAuth()
  .body<CreateUserDto>(schema)
  .handle(async (body) => {
    // ✅ Only 'body' parameter, guards don't add anything
  })
```

### 3. Order Determines Parameters ✅

**Test**: Does extractor order determine parameter order?

**Result**: Yes!

```typescript
// Different order = different parameters
route().body(s1).auth().handle((body, user) => {})
route().auth().body(s1).handle((user, body) => {})
```

### 4. Custom Extensions ✅

**Test**: Can users add custom guards/extractors/middleware?

**Result**: Yes, with explicit methods!

```typescript
route()
  .use(myMiddleware())         // Custom middleware
  .guard(myGuard())             // Custom guard
  .extract<string>(myExtractor()) // Custom extractor
  .handle(async (extracted) => {})
```

### 5. Fluent API Readability ✅

**Test**: Is the API readable and intuitive?

**Result**: Highly readable!

```typescript
// Reads like English:
route()
  .use(requestLogger())        // "use request logger"
  .rateLimit({ max: 100 })     // "rate limit to 100"
  .requireAuth()                // "require auth"
  .body(UserSchema)             // "with body validated by UserSchema"
  .handle(async (body) => {})  // "handle with body"
```

## Technical Validation

### Type System Success

✅ **Tuple Type Accumulation**: `RouteBuilder<TExtracted extends any[]>` successfully accumulates types
✅ **Spread Operator**: `RouteBuilder<[...TExtracted, T]>` works flawlessly
✅ **Handler Inference**: Handler parameters automatically typed from tuple
✅ **Error Catching**: TypeScript catches type mismatches at compile time
✅ **No Type Limits Hit**: Tested up to 5+ extractors without issues

### TypeScript Type Checking

All files pass strict TypeScript checks:
- ✅ `route-builder.ts` - Core implementation
- ✅ `examples.ts` - Usage examples
- ✅ `type-tests.ts` - Type-level tests

Command: `npm run typecheck` - **0 errors**

## Developer Experience Assessment

### IDE Support: Excellent ✅

- **Autocomplete**: All methods show up correctly
- **Parameter Types**: Hovering shows inferred types
- **Error Messages**: Clear type errors when mistakes are made
- **Refactoring**: Renaming types updates handler signatures

### Readability: Excellent ✅

The fluent chain is self-documenting:

```typescript
// Very clear what's happening:
route()
  .rateLimit({ max: 100 })        // Rate limiting applied
  .requireAuth()                   // Authentication required
  .requireRole('admin')            // Admin role required
  .body(CreateUserSchema)          // Body validated
  .params(ParamsSchema)            // Params validated
  .auth()                          // User extracted
  .handle(async (body, params, user) => {
    // All types known!
  })
```

### Learning Curve: Low ✅

- **Explicit method names** - `.use()`, `.guard()`, `.extract()` are self-explanatory
- **Consistent pattern** - All methods return `this` for chaining
- **Type-guided** - IDE tells you what parameters you'll get

## Design Patterns That Worked

### 1. Explicit Method Names

Using `.use()`, `.guard()`, `.extract()` instead of a single `.middleware()` makes intent crystal clear:

```typescript
.use(logger)      // Side effects only
.guard(checkAuth) // Validation only
.extract(getUser) // Extracts typed value
```

### 2. Built-in Convenience Methods

Providing built-in methods (`.body()`, `.auth()`) alongside generic methods (`.extract()`) gives great DX:

```typescript
.body(schema)          // Common case - clean syntax
.extract(myThing())    // Custom case - still simple
```

### 3. Type-Level Accumulation

Using tuple types to accumulate extracted values works perfectly:

```typescript
class RouteBuilder<TExtracted extends any[] = []> {
  extract<T>(...): RouteBuilder<[...TExtracted, T]>
  handle(handler: (...args: TExtracted) => any)
}
```

## Discovered Limitations

### 1. Parameter Order Mix-Ups

**Issue**: TypeScript won't catch if you name parameters in wrong order (if types are compatible)

```typescript
route()
  .body<User>(schema)
  .auth<User>()
  .handle(async (user, body) => {
    // TypeScript allows this if both are User type!
    // Must rely on convention and naming
  })
```

**Mitigation**: Convention and naming. Keep consistent extractor order.

### 2. No Compile-Time Extractor Order Enforcement

**Issue**: Nothing prevents mixing guards and extractors arbitrarily

```typescript
route()
  .body(schema)        // Extractor
  .rateLimit()         // Guard (could be before body)
  .auth()              // Extractor
```

**Decision**: Allow flexibility. Enforce order in docs/conventions, not compiler.

### 3. Handler Can Ignore Parameters

**Issue**: TypeScript allows handlers to ignore parameters

```typescript
route()
  .body(schema)
  .handle(async () => {
    // Valid! body is available but not used
  })
```

**Decision**: This is actually fine - same as `array.map()` ignoring index/array params.

## Performance Considerations

**Not tested in POC** but considerations for production:

1. **Async Chain**: Each guard/extractor is async - could add latency
2. **Validation Cost**: Schema validation on every request
3. **Memory**: Accumulating arrays of functions

**Recommendation**: Benchmark in real scenarios before optimization.

## Questions Resolved

### ✅ Does type inference work?
Yes, perfectly.

### ✅ Is it readable?
Very readable - better than decorators.

### ✅ Can users extend it?
Yes, via `.use()`, `.guard()`, `.extract()`.

### ✅ Does it work without decorators?
Yes, zero decorator usage.

### ✅ Is it edge-compatible?
Yes, no Node-specific APIs used.

## Questions for ADR

### 1. Should we enforce order?

**Options**:
- A) Allow any order (current POC)
- B) Enforce: middleware → guards → extractors

**Recommendation**: Start with A (flexible), add B later if needed.

### 2. How to handle response transformation?

**Options**:
- A) Add `.intercept()` method
- B) Use `.use()` for response handling
- C) Separate concern entirely

**Recommendation**: Explore in future POC.

### 3. How to handle errors?

**Options**:
- A) Add `.catch()` method
- B) Use try/catch in handler
- C) Global error handler

**Recommendation**: Explore in future POC.

## Comparison to Alternatives

### vs. NestJS Decorators

| Aspect | Hexane (Guards/Extractors) | NestJS (Decorators) |
|--------|----------------------------|---------------------|
| Type Safety | ✅ Full inference | ⚠️ Reflection-based |
| Readability | ✅ Explicit chain | ⚠️ Scattered decorators |
| Standard JS | ✅ No experimental features | ❌ Requires decorators |
| Bundle Size | ✅ Tree-shakeable | ⚠️ Reflection overhead |
| Edge Compatible | ✅ Yes | ❌ Reflection not available |

### vs. Express/Fastify Middleware

| Aspect | Hexane | Express/Fastify |
|--------|--------|-----------------|
| Type Safety | ✅ Full | ❌ Manual typing |
| DX | ✅ Fluent | ⚠️ Array of functions |
| Extract Values | ✅ Automatic | ❌ Manual (req.body, etc) |
| Validation | ✅ Built-in | ❌ Manual |

### vs. tRPC

| Aspect | Hexane | tRPC |
|--------|--------|------|
| Type Safety | ✅ Full | ✅ Full |
| HTTP Access | ✅ Full control | ⚠️ RPC abstraction |
| Flexibility | ✅ Any HTTP pattern | ⚠️ RPC-focused |
| Learning Curve | ✅ Low | ⚠️ Higher |

## Recommendation

**✅ Proceed with Guards & Extractors pattern**

The POC successfully validates:
- Type inference works perfectly
- Developer experience is excellent
- No decorators needed
- Fully extensible
- Edge-compatible
- Readable and maintainable

**Next Steps**:
1. Write ADR documenting this decision
2. Implement in core framework
3. Add real schema validation (Zod, Valibot)
4. Create POC for interceptors/error handling
5. Performance benchmarks

## Files Reference

- `route-builder.ts` - Core implementation
- `examples.ts` - Comprehensive usage examples
- `type-tests.ts` - Type-level tests
- `README.md` - POC documentation

---

**Conclusion**: The Guards & Extractors pattern is a solid foundation for Hexane's routing system. It achieves enterprise-grade patterns without decorators, provides excellent type safety, and maintains a clean, readable API.
