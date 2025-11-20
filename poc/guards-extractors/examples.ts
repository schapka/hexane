/**
 * POC Examples: Guards & Extractors Fluent API
 *
 * This file demonstrates various usage patterns of the route builder
 */

import { route } from './route-builder';

// ============================================================================
// Mock Types & Schemas
// ============================================================================

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface CreateUserDto {
  email: string;
  name: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
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
const UpdateUserSchema = {};
const UserParamsSchema = {};

// ============================================================================
// Custom Guards & Extractors
// ============================================================================

/**
 * Custom Guard: Check if system is in maintenance mode
 */
const checkMaintenanceMode = () => async (event: any) => {
  const isMaintenanceMode = false; // Would check actual state
  if (isMaintenanceMode) {
    throw new Error('System is in maintenance mode');
  }
  return true;
};

/**
 * Custom Extractor: Extract client IP address
 */
const clientIpExtractor = () => async (event: any) => {
  return event.headers['x-forwarded-for'] || event.ip || 'unknown';
};

/**
 * Custom Middleware: Request logger
 */
const requestLogger = () => async (event: any) => {
  console.log(`${event.method} ${event.path}`);
};

/**
 * Custom Middleware: Add request ID
 */
const addRequestId = () => async (event: any) => {
  event.context.requestId = Math.random().toString(36);
};

// ============================================================================
// Example 1: Simple route with body extractor
// ============================================================================

export const createUserRoute = route()
  .body<CreateUserDto>(CreateUserSchema)
  .handle(async (body) => {
    // ✅ Type-safe: body is CreateUserDto
    console.log('Creating user:', body.email);
    return { id: '123', ...body };
  });

// ============================================================================
// Example 2: Route with guards and extractors
// ============================================================================

export const updateUserRoute = route()
  // Guards first - validation without extraction
  .rateLimit({ max: 100 })
  .requireAuth()
  .requireRole('admin')

  // Extractors - add typed values
  .params<UserParams>(UserParamsSchema)
  .body<UpdateUserDto>(UpdateUserSchema)
  .auth<User>()

  // Handler receives only extracted values
  .handle(async (params, body, user) => {
    // ✅ Type-safe: params is UserParams, body is UpdateUserDto, user is User
    console.log(`User ${user.email} updating user ${params.id}`);
    return { id: params.id, ...body };
  });

// ============================================================================
// Example 3: Complete example with all features
// ============================================================================

export const complexRoute = route()
  // General middleware
  .use(requestLogger())
  .use(addRequestId())

  // Custom guard
  .guard(checkMaintenanceMode())

  // Built-in guards
  .rateLimit({ max: 50 })
  .requireAuth()

  // Built-in extractors
  .params<UserParams>(UserParamsSchema)
  .query<PaginationQuery>()
  .auth<User>()

  // Custom extractor
  .extract<string>(clientIpExtractor())

  // Handler gets all extracted values in order
  .handle(async (params, query, user, clientIp) => {
    // ✅ All parameters are fully typed!
    console.log(`Request from ${clientIp} by ${user.email}`);
    console.log(`Params:`, params);
    console.log(`Query:`, query);

    return {
      userId: params.id,
      requestedBy: user.email,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  });

// ============================================================================
// Example 4: GET with only extractors (no guards)
// ============================================================================

export const getUserRoute = route()
  .params<UserParams>(UserParamsSchema)
  .query<{ include?: string }>()
  .handle(async (params, query) => {
    console.log(`Getting user ${params.id}`);
    if (query.include) {
      console.log(`Including: ${query.include}`);
    }
    return { id: params.id, email: 'user@example.com' };
  });

// ============================================================================
// Example 5: Public route with only guards (no extractors)
// ============================================================================

export const publicRoute = route()
  .rateLimit({ max: 1000 })
  .handle(async () => {
    // ✅ No parameters - nothing was extracted
    return { message: 'Hello, World!' };
  });

// ============================================================================
// Example 6: Only middleware (logging, metrics)
// ============================================================================

export const healthCheckRoute = route()
  .use(requestLogger())
  .handle(async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

// ============================================================================
// Example 7: Demonstrate type inference
// ============================================================================

export const typeInferenceDemo = () => {
  // Each extractor adds to the type tuple

  const r1 = route()
    .body<CreateUserDto>(CreateUserSchema);
  // Handler expects: (body: CreateUserDto) => any

  const r2 = route()
    .body<CreateUserDto>(CreateUserSchema)
    .auth<User>();
  // Handler expects: (body: CreateUserDto, user: User) => any

  const r3 = route()
    .params<UserParams>(UserParamsSchema)
    .query<PaginationQuery>()
    .auth<User>();
  // Handler expects: (params: UserParams, query: PaginationQuery, user: User) => any

  // Guards don't affect the handler signature
  const r4 = route()
    .rateLimit({ max: 100 })
    .requireAuth()
    .body<CreateUserDto>(CreateUserSchema);
  // Handler still expects: (body: CreateUserDto) => any
};

// ============================================================================
// Example 8: Order matters - extractors determine parameter order
// ============================================================================

export const orderDemo = () => {
  // Different order = different parameter order

  const route1 = route()
    .body<CreateUserDto>(CreateUserSchema)
    .auth<User>()
    .handle(async (body, user) => {
      // ✅ First param is body, second is user
    });

  const route2 = route()
    .auth<User>()
    .body<CreateUserDto>(CreateUserSchema)
    .handle(async (user, body) => {
      // ✅ First param is user, second is body
    });
};

// ============================================================================
// Example 9: Mix custom and built-in seamlessly
// ============================================================================

export const mixedRoute = route()
  .use(requestLogger())              // Custom middleware
  .guard(checkMaintenanceMode())     // Custom guard
  .rateLimit({ max: 100 })           // Built-in guard
  .extract<string>(clientIpExtractor()) // Custom extractor
  .body<CreateUserDto>(CreateUserSchema) // Built-in extractor
  .auth<User>()                      // Built-in extractor
  .handle(async (clientIp, body, user) => {
    return { clientIp, body, user };
  });
