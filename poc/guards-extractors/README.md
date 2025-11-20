# POC: Guards & Extractors Fluent API

## Overview

This POC validates the Guards & Extractors pattern for Hexane's route handling API.

## Goals

- ✅ Prove fluent chaining works with TypeScript
- ✅ Validate type inference for handler parameters
- ✅ Test developer experience (readability, usability)
- ✅ Demonstrate custom guard/extractor support
- ✅ Verify separation of concerns (guards vs extractors vs middleware)

## API Design

### Three Core Concepts

1. **Guards** - Validate/check without extracting values
   - `.guard()` - custom guards
   - `.rateLimit()`, `.requireAuth()`, `.requireRole()` - built-in guards

2. **Extractors** - Extract typed values from requests
   - `.extract()` - custom extractors
   - `.body()`, `.params()`, `.query()`, `.auth()`, `.header()` - built-in extractors

3. **Middleware** - General request processing
   - `.use()` - custom middleware (logging, request IDs, etc.)

### Key Design Decisions

#### 1. Explicit Method Names

```typescript
route()
  .use(middleware)      // Explicit: general middleware
  .guard(myGuard)       // Explicit: validation only
  .extract(myExtractor) // Explicit: extracts a value
  .body(schema)         // Built-in extractor
```

**Why?** Self-documenting code. Reading the chain tells you exactly what's happening.

#### 2. Handler Receives Only Extracted Values

```typescript
route()
  .rateLimit({ max: 100 })  // No parameter added
  .body(UserSchema)         // Adds 'body' parameter
  .auth()                   // Adds 'user' parameter
  .handle(async (body, user) => {
    // ✅ Only extracted values, no event object!
  })
```

**Why?** Forces clear intent. If you need a value, you must extract it.

#### 3. Order Determines Parameter Order

```typescript
// Different extractor order = different parameter order
route()
  .body(schema)
  .auth()
  .handle(async (body, user) => {}) // body first

route()
  .auth()
  .body(schema)
  .handle(async (user, body) => {}) // user first
```

**Why?** Natural reading order. What you see is what you get.

## Files

- `route-builder.ts` - Core implementation with type inference
- `examples.ts` - Comprehensive usage examples
- `type-tests.ts` - Type-level tests to verify inference

## Type Inference

The magic happens in the `RouteBuilder<TExtracted>` generic:

```typescript
class RouteBuilder<TExtracted extends any[] = []> {
  // Guards don't change the type
  guard(g: Guard): RouteBuilder<TExtracted>

  // Extractors append to the tuple
  extract<T>(e: Extractor<T>): RouteBuilder<[...TExtracted, T]>

  // Handler receives the extracted tuple
  handle(handler: (...args: TExtracted) => any)
}
```

## Testing the POC

### Type Testing

Check if TypeScript properly infers types:

```bash
# Should show no type errors
npx tsc --noEmit poc/guards-extractors/examples.ts
```

### Developer Experience

Open `examples.ts` in your IDE and verify:

1. **Autocomplete works** - methods show up correctly
2. **Parameter types infer** - hovering over handler params shows correct types
3. **Type errors catch mistakes** - wrong parameter types are caught
4. **Readable** - the fluent chains read naturally

## Findings

### ✅ What Works

1. **Type inference is solid** - TypeScript correctly infers handler parameters from extractors
2. **Fluent API reads well** - chains are easy to understand
3. **Separation of concerns** - clear distinction between guards/extractors/middleware
4. **Custom additions work** - `.guard()`, `.extract()`, `.use()` support custom logic
5. **Order flexibility** - you can arrange extractors however makes sense

### 🤔 Questions to Resolve

1. **Should we enforce order?** (middleware → guards → extractors)
   - Pro: More predictable
   - Con: Less flexible

2. **Error handling syntax?**
   - Should we add `.catch()` for error handling?
   - Or handle errors separately?

3. **Interceptor support?**
   - How to handle response transformation?
   - Should interceptors be part of the builder?

4. **Guard composition?**
   - Should guards be composable? (`.guards(rateLimit, auth)`)
   - Or keep them individual for readability?

5. **Maximum extractors?**
   - Is there a practical limit to tuple size?
   - Should we warn if too many extractors?

### 🚧 Potential Issues

1. **Tuple length limits** - TypeScript has limits on tuple sizes (but probably fine for real use)
2. **Runtime overhead** - Each extractor is async, could add latency
3. **Error messages** - Complex type errors might be hard to debug
4. **Testing complexity** - Testing routes with many extractors needs mock data

## Next Steps

1. **Validate with real schemas** - Test with Zod, Valibot
2. **Add interceptor pattern** - Design response transformation API
3. **Error handling** - Design `.catch()` or similar
4. **Performance test** - Measure overhead of extractor chain
5. **Write ADR** - Document this pattern officially

## Comparison to Other Frameworks

### NestJS
```typescript
// NestJS style (with decorators)
@Post('/users')
@RateLimit({ max: 100 })
@UseGuards(AuthGuard)
async create(
  @Body() body: CreateUserDto,
  @User() user: User
) {}
```

### Hexane (our approach)
```typescript
// Hexane style (decorator-free)
route()
  .rateLimit({ max: 100 })
  .requireAuth()
  .body(CreateUserDto)
  .auth()
  .handle(async (body, user) => {})
```

**Advantages over decorators:**
- No experimental features
- More explicit (can see the full chain)
- Better type inference
- Easier to test (no reflection needed)

## Conclusion

The Guard/Extractor pattern with fluent API works well:
- ✅ Type-safe
- ✅ Readable
- ✅ Flexible
- ✅ No decorators needed
- ✅ Extensible

Ready to move forward with ADR and full implementation.
