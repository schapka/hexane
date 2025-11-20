/**
 * Type-level tests for Guards & Extractors API
 *
 * These tests verify that TypeScript properly infers types.
 * If this file has no type errors, the inference is working!
 */

import { route } from './route-builder';

// ============================================================================
// Test Types
// ============================================================================

interface User {
  id: string;
  email: string;
}

interface CreateUserDto {
  email: string;
  name: string;
}

interface UserParams {
  id: string;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
}

const UserSchema = {};
const CreateUserSchema = {};

// ============================================================================
// Test 1: Single Extractor
// ============================================================================

// ✅ Should accept handler with one parameter
route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // Type check: body should be CreateUserDto
    const email: string = body.email;
    const name: string = body.name;
    return { success: true };
  });

// ❌ Should error: wrong parameter type
route()
  .body<CreateUserDto>(CreateUserSchema)
  // @ts-expect-error - body should be CreateUserDto, not string
  .handle(async (body: string) => {
    return { success: true };
  });

// ✅ TypeScript allows ignoring parameters (like array.map)
route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async () => {
    // Valid: you can ignore extracted parameters if you don't need them
    return { success: true };
  });

// ============================================================================
// Test 2: Multiple Extractors
// ============================================================================

// ✅ Should accept handler with correct parameter order
route()
  .body<CreateUserDto>(CreateUserSchema)
  .auth<User>()
  .handle(async (body, user) => {
    // Type checks
    const email: string = body.email;
    const userId: string = user.id;
    return { success: true };
  });

// ✅ Different order = different parameters
route()
  .auth<User>()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (user, body) => {
    // Note: user is first now!
    const userId: string = user.id;
    const email: string = body.email;
    return { success: true };
  });

// ⚠️ Note: TypeScript won't catch parameter name mix-ups if types are compatible
// This is a known limitation - you must rely on convention and naming
route()
  .body<CreateUserDto>(CreateUserSchema)
  .auth<User>()
  .handle(async (user, body) => {
    // Both User and CreateUserDto have 'email', so this is technically valid
    // Best practice: keep extractor order consistent and use descriptive names
    const email: string = user.email;
    return { success: true };
  });

// ============================================================================
// Test 3: Three or More Extractors
// ============================================================================

// ✅ Should work with 3+ extractors
route()
  .params<UserParams>({})
  .query<PaginationQuery>()
  .auth<User>()
  .handle(async (params, query, user) => {
    const id: string = params.id;
    const page: number | undefined = query.page;
    const email: string = user.email;
    return { success: true };
  });

// ✅ Should work with many extractors
route()
  .params<UserParams>({})
  .query<PaginationQuery>()
  .body<CreateUserDto>(CreateUserSchema)
  .auth<User>()
  .header<string>('x-api-key')
  .handle(async (params, query, body, user, apiKey) => {
    const id: string = params.id;
    const page: number | undefined = query.page;
    const name: string = body.name;
    const email: string = user.email;
    const key: string = apiKey;
    return { success: true };
  });

// ============================================================================
// Test 4: Guards Don't Affect Parameters
// ============================================================================

// ✅ Guards should not add parameters
route()
  .rateLimit({ max: 100 })
  .requireAuth()
  .requireRole('admin')
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // Only body parameter, guards don't add anything
    const email: string = body.email;
    return { success: true };
  });

// ✅ Guards before and after extractors
route()
  .rateLimit({ max: 100 })
  .body<CreateUserDto>(CreateUserSchema)
  .requireAuth()
  .auth<User>()
  .handle(async (body, user) => {
    // Guards don't matter for parameter types
    return { success: true };
  });

// ============================================================================
// Test 5: No Extractors = No Parameters
// ============================================================================

// ✅ Only guards = handler with no parameters
route()
  .rateLimit({ max: 100 })
  .requireAuth()
  .handle(async () => {
    // No parameters expected
    return { message: 'Hello' };
  });

// ❌ Should error: handler expects no parameters
route()
  .rateLimit({ max: 100 })
  // @ts-expect-error - no extractors, so handler shouldn't accept parameters
  .handle(async (param: any) => {
    return { message: 'Hello' };
  });

// ============================================================================
// Test 6: Middleware Doesn't Affect Parameters
// ============================================================================

const logger = () => async (event: any) => {
  console.log('Logging');
};

// ✅ Middleware doesn't add parameters
route()
  .use(logger())
  .use(logger())
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // Only body parameter, middleware doesn't add anything
    return { success: true };
  });

// ============================================================================
// Test 7: Custom Guards Don't Extract
// ============================================================================

const myGuard = () => async (event: any) => true;

// ✅ Custom guards don't add parameters
route()
  .guard(myGuard())
  .guard(myGuard())
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // Only body, guards don't extract
    return { success: true };
  });

// ============================================================================
// Test 8: Custom Extractors Add Parameters
// ============================================================================

const ipExtractor = () => async (event: any) => '127.0.0.1';

// ✅ Custom extractors add typed parameters
route()
  .extract<string>(ipExtractor())
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (ip, body) => {
    const ipAddress: string = ip;
    const email: string = body.email;
    return { success: true };
  });

// ============================================================================
// Test 9: Type Inference with Generic Methods
// ============================================================================

// ✅ Generic type parameters should be inferred correctly
route()
  .query<{ search?: string; filter?: string }>()
  .handle(async (query) => {
    const search: string | undefined = query.search;
    const filter: string | undefined = query.filter;
    // @ts-expect-error - property doesn't exist
    const invalid = query.nonExistent;
    return { success: true };
  });

// ============================================================================
// Test 10: Return Type Freedom
// ============================================================================

// ✅ Handler can return anything
route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    return { id: '123', email: body.email };
  });

route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    return 'string result';
  });

route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    return 42;
  });

route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // void is fine too
  });

// ============================================================================
// Test 11: Async/Sync Handlers
// ============================================================================

// ✅ Both async and sync handlers should work
route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    return { success: true };
  });

route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle((body) => {
    return { success: true };
  });

// ============================================================================
// Conclusion
// ============================================================================

/**
 * If this file compiles without errors (except the intentional @ts-expect-error),
 * then the type inference is working correctly!
 *
 * To test:
 * npx tsc --noEmit poc/guards-extractors/type-tests.ts
 */

export {};
