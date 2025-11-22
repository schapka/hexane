# Hexane User Guide - Getting Started

This guide shows you how to build applications with Hexane. The framework handles all Nitro integration internally - you just focus on building your app!

## Quick Start

### 1. Create Your Application Module

```typescript
// app/app.module.ts
import { defineModule, defineRoute } from 'hexane'
import { defineEventHandler } from 'h3'
import { UsersModule } from './modules/users/users.module'

const healthCheck = defineRoute('GET', '/health', defineEventHandler(() => {
  return { status: 'ok' }
}))

export const AppModule = defineModule({
  name: 'app',
  imports: [UsersModule],  // Import feature modules
  routes: [healthCheck],   // Root-level routes
  providers: [],           // Root-level services
})
```

### 2. Export Your Module

```typescript
// app/main.ts
export { AppModule } from './app.module'
```

**That's it!** Hexane automatically:
- Discovers your root module
- Traverses the module tree
- Registers all routes with Nitro
- Handles deployment to any target

## Project Structure

```
my-hexane-app/
├── app/                      # YOUR APPLICATION CODE
│   ├── main.ts              # Export your AppModule
│   ├── app.module.ts        # Root module
│   └── modules/             # Feature modules
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.routes.ts
│       │   └── users.service.ts
│       └── products/
│           ├── products.module.ts
│           └── ...
│
├── routes/                   # HEXANE INTERNALS (don't touch!)
│   └── [...].ts             # Framework-managed Nitro integration
│
├── core.ts                   # Hexane framework code
├── nitro.config.ts          # Nitro configuration
└── package.json
```

## Creating Feature Modules

### Define a Module

```typescript
// app/modules/users/users.module.ts
import { defineModule } from 'hexane'
import { UserService } from './users.service'
import { listUsers, getUser, createUser } from './users.routes'

export const UsersModule = defineModule({
  name: 'users',
  routes: [listUsers, getUser, createUser],
  providers: [UserService],
  exports: [UserService],  // Other modules can use this
})
```

### Define Routes

```typescript
// app/modules/users/users.routes.ts
import { defineRoute } from 'hexane'
import { defineEventHandler } from 'h3'

export const listUsers = defineRoute('GET', '/api/users',
  defineEventHandler((event) => {
    return { data: [/* users */] }
  })
)

export const getUser = defineRoute('GET', '/api/users/:id',
  defineEventHandler((event) => {
    const id = event.context.params?.id
    return { data: /* user */ }
  })
)
```

### Define Services

```typescript
// app/modules/users/users.service.ts
export class UserService {
  findAll() {
    return []
  }

  findById(id: string) {
    return null
  }

  create(data: any) {
    return data
  }
}
```

## Module Composition

Modules can import other modules, forming a dependency tree:

```typescript
// app/app.module.ts
export const AppModule = defineModule({
  name: 'app',
  imports: [
    CommonModule,      // Shared utilities
    UsersModule,       // User management
    ProductsModule,    // Product catalog
    OrdersModule,      // Orders (depends on Users & Products)
  ],
  // ...
})
```

## Running Your Application

```bash
# Development (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck
```

## Deployment

Change the preset in `nitro.config.ts` to deploy anywhere:

```typescript
export default defineNitroConfig({
  // Choose your deployment target:
  preset: 'node-server',      // Default
  // preset: 'cloudflare-pages', // Cloudflare
  // preset: 'vercel',           // Vercel
  // preset: 'netlify',          // Netlify
  // ... and many more!
})
```

Then build and deploy:

```bash
npm run build
# Follow deployment instructions for your platform
```

## What You DON'T Need to Worry About

❌ **Nitro integration** - Hexane handles it
❌ **Route registration** - Automatic from modules
❌ **Build configuration** - Sensible defaults
❌ **Deployment setup** - Change one line in config

## What You Focus On

✅ **Business logic** - Your modules and services
✅ **API design** - Your routes and handlers
✅ **Module composition** - How features work together

## Key Principles

1. **Module-Based Architecture**: Organize code by feature, not file type
2. **Explicit Composition**: Import modules explicitly - no magic scanning
3. **Type-Safe**: Full TypeScript inference throughout
4. **Edge-Ready**: Works on Node, Cloudflare, Vercel, and more
5. **Zero Config**: Works out of the box, customize when needed

## Next Steps

- Add Guards & Extractors for request validation (coming soon)
- Use Dependency Injection for services (coming soon)
- Enable auto-configuration for databases (coming soon)

---

**The Framework You Control, Not the Other Way Around** 🚀
