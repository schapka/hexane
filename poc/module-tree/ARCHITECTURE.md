# Hexane Architecture - Clean Abstraction Layer

## Overview

Hexane provides a clean abstraction over Nitro, similar to how Nuxt abstracts Nitro but for backend APIs with explicit module composition.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         USER CODE                            │
│  (What developers write - framework-agnostic)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  app/                                                         │
│  ├── main.ts              ← User entry point                 │
│  │   export { AppModule }                                    │
│  │                                                            │
│  ├── app.module.ts        ← Root module                      │
│  │   defineModule({                                          │
│  │     imports: [UsersModule, ProductsModule]                │
│  │     routes: [...]                                         │
│  │   })                                                       │
│  │                                                            │
│  └── modules/             ← Feature modules                  │
│      ├── users/                                              │
│      └── products/                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    (imports AppModule)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    HEXANE FRAMEWORK LAYER                    │
│           (Provided by framework - hidden)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  routes/[...].ts          ← Nitro integration (catch-all)    │
│  │                                                            │
│  ├─ import { AppModule } from '../app/main'                  │
│  ├─ createH3AppFromModule(AppModule)                         │
│  └─ export defineEventHandler((event) => app.handler(event)) │
│                                                               │
│  core.ts                  ← Framework APIs                   │
│  ├─ defineModule()                                           │
│  ├─ defineRoute()                                            │
│  └─ createH3AppFromModule()                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                      (delegates to)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      NITRO / H3 LAYER                        │
│            (Runtime & deployment handled)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Build system (Vite, esbuild)                              │
│  • Development server (HMR)                                  │
│  • Production bundling                                       │
│  • Deployment adapters                                       │
│    - Node.js                                                 │
│    - Cloudflare Workers/Pages                               │
│    - Vercel                                                  │
│    - Netlify                                                 │
│    - Deno Deploy                                             │
│    - ... and more                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. User Code is Framework-Agnostic

Users write standard TypeScript with clean APIs:

```typescript
// No Nitro knowledge required!
export const AppModule = defineModule({
  imports: [UsersModule],
  routes: [healthCheck],
})
```

### 2. Framework Layer is Invisible

The `routes/[...].ts` file is provided by Hexane, not written by users:

```typescript
// ⚠️ Framework Internal - Users never touch this
import { createH3AppFromModule } from '../core'
import { AppModule } from '../app/main'

const { app } = createH3AppFromModule(AppModule)
export default defineEventHandler((event) => app.handler(event))
```

### 3. Nitro Integration via Catch-All Route

- **Why catch-all?** Nitro's routing is configured at build time from `routes/`
- **Why not plugin?** Plugins run too late to register routes
- **Industry standard:** tRPC, SvelteKit, Remix all use this pattern

### 4. Separation of Concerns

| Layer | Responsibility | Who Manages |
|-------|---------------|-------------|
| **User Code** | Business logic, modules, routes | Developer |
| **Framework** | Nitro integration, module traversal | Hexane |
| **Nitro** | Build, deployment, runtime | Nitro |

## Developer Experience Comparison

### Before (Exposing Internals)

```
my-app/
├── routes/
│   └── [...].ts              ← User had to understand this
├── nitro.config.ts           ← User configured manually
└── example-app/
    └── main.ts               ← Mixed concerns
```

### After (Clean Abstraction)

```
my-app/
├── app/                      ← USER FOCUSES HERE
│   ├── main.ts              ← Simple: export { AppModule }
│   └── app.module.ts        ← Define modules
├── routes/                   ← HEXANE PROVIDES
│   └── [...].ts             ← Framework-managed
└── core.ts                   ← HEXANE PROVIDES
```

## Benefits

### For Users
✅ Simple mental model (just modules)
✅ No Nitro knowledge required
✅ Framework-agnostic code
✅ Easy to test (pure TypeScript)
✅ Clear project structure

### For Framework
✅ Full control over integration
✅ Can evolve internals independently
✅ Easy to add features (DI, Guards, etc.)
✅ Compatible with all Nitro targets
✅ No breaking changes to user code

## Comparison with Other Frameworks

### Nuxt
- **Approach:** File-based routing (`server/api/`)
- **User writes:** Individual route files
- **Framework handles:** Auto-scanning and registration

### NestJS
- **Approach:** Decorator-based modules
- **User writes:** `@Module()` with decorators
- **Framework handles:** Reflection and DI container

### Hexane
- **Approach:** Module tree composition
- **User writes:** `defineModule()` with imports
- **Framework handles:** Module traversal + Nitro integration

## Future Enhancements

With this architecture, we can add:
- [ ] Guards & Extractors (no user code changes)
- [ ] Dependency Injection (register providers in modules)
- [ ] Auto-configuration (detect packages, auto-setup)
- [ ] CLI tooling (generate modules, routes)
- [ ] Development UI (route viewer, module graph)

All without changing the user's module definitions!

## Production Vision

**This POC shows files for educational purposes.** In production, the abstraction will be completely invisible.

See **[FUTURE_ARCHITECTURE.md](./FUTURE_ARCHITECTURE.md)** for the complete production design where:
- ✅ Users only see `app/` directory
- ✅ All Nitro integration hidden in `@hexane/core` package
- ✅ CLI handles everything (`hexane dev`, `hexane build`)
- ✅ No framework files in user projects

```
User's Project (v1.0):
my-app/
├── app/              # 100% user code
│   └── main.ts      # export { AppModule }
└── package.json     # "dev": "hexane dev"
```

## Conclusion

Hexane's abstraction achieves:
1. **Clean API** - Users work with intuitive concepts
2. **Full Control** - Framework manages complexity
3. **Flexibility** - Works with any Nitro target
4. **Future-Proof** - Can evolve without breaking user code
5. **Invisible** - Production version hides all internals (see FUTURE_ARCHITECTURE.md)

This is the same level of abstraction Nuxt provides for full-stack apps, but optimized for backend APIs with explicit composition.
