/**
 * POC: Guards & Extractors Fluent API
 *
 * Core RouteBuilder implementation that supports:
 * - Guards: validation without value extraction
 * - Extractors: type-safe data extraction
 * - Middleware: general request processing
 * - Type inference: handler params match extracted values
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base handler function signature
 */
type Handler<TExtracted extends any[]> = (...args: TExtracted) => any | Promise<any>;

/**
 * Middleware function (no value extraction)
 */
type Middleware = (event: any) => void | Promise<void>;

/**
 * Guard function (returns boolean or throws)
 */
type Guard = (event: any) => boolean | Promise<boolean>;

/**
 * Extractor function (returns typed value)
 */
type Extractor<T> = (event: any) => T | Promise<T>;

// ============================================================================
// Route Builder
// ============================================================================

/**
 * Fluent API builder for route handlers
 *
 * @template TExtracted - Tuple of extracted types (grows as extractors are added)
 */
export class RouteBuilder<TExtracted extends any[] = []> {
  private middlewares: Middleware[] = [];
  private guards: Guard[] = [];
  private extractors: Extractor<any>[] = [];

  // ==========================================================================
  // General Middleware (.use)
  // ==========================================================================

  /**
   * Add general middleware (side effects, no extraction)
   */
  use(middleware: Middleware): RouteBuilder<TExtracted> {
    this.middlewares.push(middleware);
    return this;
  }

  // ==========================================================================
  // Guards (.guard, and built-in guards)
  // ==========================================================================

  /**
   * Add a custom guard (validation without extraction)
   */
  guard(guard: Guard): RouteBuilder<TExtracted> {
    this.guards.push(guard);
    return this;
  }

  /**
   * Built-in: Rate limiting guard
   */
  rateLimit(options: { max: number; window?: number }): RouteBuilder<TExtracted> {
    return this.guard(async (event) => {
      // Implementation would go here
      console.log(`Rate limit: ${options.max} requests`);
      return true;
    });
  }

  /**
   * Built-in: Require authentication guard
   */
  requireAuth(): RouteBuilder<TExtracted> {
    return this.guard(async (event) => {
      // Implementation would check if auth exists
      if (!event.context.auth) {
        throw new Error('Unauthorized');
      }
      return true;
    });
  }

  /**
   * Built-in: Require specific role guard
   */
  requireRole(role: string): RouteBuilder<TExtracted> {
    return this.guard(async (event) => {
      if (!event.context.auth?.roles?.includes(role)) {
        throw new Error(`Forbidden: requires ${role} role`);
      }
      return true;
    });
  }

  // ==========================================================================
  // Extractors (.extract, and built-in extractors)
  // ==========================================================================

  /**
   * Add a custom extractor (extracts typed value)
   *
   * NOTE: The type parameter T is appended to the extracted tuple
   */
  extract<T>(extractor: Extractor<T>): RouteBuilder<[...TExtracted, T]> {
    const newBuilder = this as any as RouteBuilder<[...TExtracted, T]>;
    newBuilder.extractors.push(extractor);
    return newBuilder;
  }

  /**
   * Built-in: Extract and validate request body
   */
  body<T>(schema: any): RouteBuilder<[...TExtracted, T]> {
    return this.extract<T>(async (event) => {
      const body = await event.body();
      // Would validate with schema here
      return body as T;
    });
  }

  /**
   * Built-in: Extract and validate route params
   */
  params<T>(schema: any): RouteBuilder<[...TExtracted, T]> {
    return this.extract<T>(async (event) => {
      const params = event.params;
      // Would validate with schema here
      return params as T;
    });
  }

  /**
   * Built-in: Extract and validate query parameters
   */
  query<T>(): RouteBuilder<[...TExtracted, T]> {
    return this.extract<T>(async (event) => {
      const query = event.query;
      return query as T;
    });
  }

  /**
   * Built-in: Extract authenticated user
   */
  auth<T = any>(): RouteBuilder<[...TExtracted, T]> {
    return this.extract<T>(async (event) => {
      return event.context.auth as T;
    });
  }

  /**
   * Built-in: Extract specific header
   */
  header<T = string>(name: string): RouteBuilder<[...TExtracted, T]> {
    return this.extract<T>(async (event) => {
      return event.headers[name] as T;
    });
  }

  // ==========================================================================
  // Handler
  // ==========================================================================

  /**
   * Define the route handler
   *
   * The handler receives only the extracted values as parameters
   */
  handle(handler: Handler<TExtracted>) {
    return async (event: any) => {
      // Execute middleware
      for (const middleware of this.middlewares) {
        await middleware(event);
      }

      // Execute guards
      for (const guard of this.guards) {
        const result = await guard(event);
        if (!result) {
          throw new Error('Guard failed');
        }
      }

      // Execute extractors and collect values
      const extracted: any[] = [];
      for (const extractor of this.extractors) {
        const value = await extractor(event);
        extracted.push(value);
      }

      // Call handler with extracted values
      return await handler(...(extracted as TExtracted));
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new route builder
 */
export function route(): RouteBuilder<[]> {
  return new RouteBuilder();
}
