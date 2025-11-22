# Future Architecture: Invisible Abstraction

## Status

**Concept** - Documented for v1.0 implementation

## Context

The current POC exposes Nitro integration files (`routes/[...].ts`, `nitro.config.ts`) for educational purposes. In production, these should be completely hidden from users, providing a clean, framework-agnostic development experience.

## Decision

Hexane will adopt a **CLI-based architecture** (similar to Next.js/Nuxt) where all Nitro integration is managed by the framework package `@hexane/core`, making the abstraction completely invisible to users.

## User Experience

### What Users See (Production)

```
my-hexane-app/
├── app/                      # 100% user code
│   ├── main.ts              # export { AppModule }
│   ├── app.module.ts
│   └── modules/
│       ├── users/
│       └── products/
├── package.json
├── tsconfig.json
└── hexane.config.ts         # Optional overrides
```

**That's it.** No `routes/`, no `nitro.config.ts`, no framework files.

### User's package.json

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "hexane dev",
    "build": "hexane build",
    "start": "hexane start",
    "typecheck": "hexane typecheck"
  },
  "dependencies": {
    "@hexane/core": "^1.0.0"
  }
}
```

### User's Entry Point

```typescript
// app/main.ts - The ONLY framework interaction
export { AppModule } from './app.module'
```

## Architecture

### Framework Package Structure

```
@hexane/core/
├── bin/
│   └── hexane.mjs           # CLI entry point
├── cli/
│   ├── commands/
│   │   ├── dev.ts           # hexane dev
│   │   ├── build.ts         # hexane build
│   │   ├── start.ts         # hexane start
│   │   └── typecheck.ts     # hexane typecheck
│   └── loader.ts            # Load user's AppModule
├── runtime/
│   ├── core.ts              # defineModule, defineRoute, etc.
│   ├── handler.ts           # Nitro integration handler
│   └── types.ts             # Public TypeScript types
├── nitro/
│   ├── config.ts            # Default Nitro configuration
│   ├── preset.ts            # Hexane Nitro preset
│   └── routes.ts            # Catch-all route generator
└── package.json
```

### How It Works

#### 1. CLI Entry Point

```typescript
// @hexane/core/bin/hexane.mjs
#!/usr/bin/env node
import { cli } from '../cli/index.js'

cli.parse(process.argv)
```

#### 2. Dev Command

```typescript
// @hexane/core/cli/commands/dev.ts
import { createDevServer } from 'nitropack'
import { createHexaneNitroConfig } from '../../nitro/config'
import { loadUserApp } from '../loader'

export async function dev(options: DevOptions) {
  // 1. Load user's AppModule from app/main.ts
  const userModule = await loadUserApp(process.cwd())

  // 2. Generate Nitro config with embedded handler
  const nitroConfig = await createHexaneNitroConfig({
    rootDir: process.cwd(),
    userModule,
    dev: true,
    ...options
  })

  // 3. Start Nitro dev server
  const nitro = await createDevServer(nitroConfig)
  await nitro.listen(options.port || 3000)
}
```

#### 3. User Module Loader

```typescript
// @hexane/core/cli/loader.ts
export async function loadUserApp(cwd: string): Promise<ModuleDefinition> {
  // Convention: user exports AppModule from app/main.ts
  const entryPath = resolve(cwd, 'app/main.ts')

  if (!existsSync(entryPath)) {
    throw new Error(
      'Could not find app/main.ts\n' +
      'Make sure you have an app/main.ts file that exports AppModule'
    )
  }

  // Dynamic import
  const userCode = await import(pathToFileURL(entryPath).href)

  if (!userCode.AppModule) {
    throw new Error(
      'app/main.ts must export an AppModule\n' +
      'Example: export { AppModule } from "./app.module"'
    )
  }

  return userCode.AppModule
}
```

#### 4. Nitro Config Generator

```typescript
// @hexane/core/nitro/config.ts
import { defineNitroConfig } from 'nitropack/config'
import { generateCatchAllHandler } from './routes'

export async function createHexaneNitroConfig(options: HexaneOptions) {
  const { rootDir, userModule, dev } = options

  // Load user's hexane.config.ts if it exists
  const userConfig = await loadUserConfig(rootDir)

  return defineNitroConfig({
    rootDir,
    srcDir: rootDir,

    // Inject our handler via virtual module
    handlers: [
      {
        route: '/**',
        handler: '#hexane/handler'
      }
    ],

    // Virtual module that creates the handler
    virtual: {
      '#hexane/handler': generateCatchAllHandler(userModule)
    },

    // Defaults
    logLevel: dev ? 3 : 1,

    // Merge user overrides
    ...userConfig?.nitro
  })
}
```

#### 5. Handler Generator

```typescript
// @hexane/core/nitro/routes.ts
export function generateCatchAllHandler(userModule: ModuleDefinition): string {
  return `
import { defineEventHandler } from 'h3'
import { createH3AppFromModule } from '@hexane/core/runtime'

// Build h3 app from user's module tree
const { app, routes, providers } = createH3AppFromModule(${JSON.stringify(userModule)})

// Log startup (dev only)
if (import.meta.dev) {
  console.log('\\n🔷 Hexane App Starting')
  console.log('\\n📋 Registered Routes:')
  for (const route of routes) {
    console.log(\`  \${route.method.padEnd(6)} \${route.path}\`)
  }
  console.log('\\n📦 Registered Providers:')
  for (const provider of providers) {
    console.log(\`  - \${provider.name || provider}\`)
  }
  console.log('')
}

// Export handler
export default defineEventHandler((event) => {
  return app.handler(event)
})
  `.trim()
}
```

#### 6. Optional User Config

```typescript
// User's hexane.config.ts (optional)
import { defineHexaneConfig } from '@hexane/core'

export default defineHexaneConfig({
  // Override Nitro config if needed
  nitro: {
    preset: 'cloudflare-pages',
    compatibilityDate: '2024-11-22'
  },

  // Hexane-specific options
  typescript: {
    strict: true
  }
})
```

## Benefits

### For Users

| Benefit | Description |
|---------|-------------|
| **Clean Project** | No framework files cluttering the project |
| **Zero Nitro Knowledge** | Complete abstraction, no Nitro concepts to learn |
| **Framework Agnostic** | Code in `app/` is pure TypeScript, portable |
| **Easy Updates** | `npm update @hexane/core` updates everything |
| **Git Clean** | No framework noise in version control |
| **Fast Onboarding** | Just learn modules, routes, services |

### For Framework

| Benefit | Description |
|---------|-------------|
| **Full Control** | Can change Nitro integration without breaking users |
| **Easy Evolution** | Internal improvements don't affect user code |
| **Better DX** | Single `hexane dev` command vs multiple tools |
| **Consistent** | All projects have the same structure |
| **Extensible** | Plugins can hook into CLI lifecycle |
| **Testing** | Can test framework separately from user code |

## Comparison with Other Frameworks

| Framework | Hidden Files | CLI | User Sees |
|-----------|-------------|-----|-----------|
| **Next.js** | Webpack config, routing internals | `next dev/build` | `pages/` or `app/` |
| **Nuxt** | Nitro setup, auto-imports | `nuxi dev/build` | `server/`, `pages/` |
| **SvelteKit** | Vite config, adapters | `vite dev/build` | `src/routes/` |
| **NestJS** | Express/Fastify setup | `nest start` | Decorators & modules |
| **Hexane** | Nitro config, catch-all route | `hexane dev/build` | `app/` modules |

## Implementation Phases

### Phase 1: POC (Current)
- ✅ All files visible for educational purposes
- ✅ Shows Nitro integration explicitly
- ✅ Validates architecture

### Phase 2: Framework Package
- [ ] Create `@hexane/core` package
- [ ] Implement CLI with basic commands
- [ ] Package runtime and types
- [ ] Create Nitro preset

### Phase 3: Hidden Integration
- [ ] Move `routes/[...].ts` to virtual module
- [ ] Generate Nitro config from user's app
- [ ] CLI handles all Nitro interaction
- [ ] User config for overrides

### Phase 4: Enhanced DX
- [ ] `hexane init` scaffolding
- [ ] `hexane generate module` code gen
- [ ] TypeScript IDE integration
- [ ] Development UI (route viewer, module graph)

## File Organization

### POC (Educational)
```
poc/module-tree/
├── app/                     # User code
├── routes/[...].ts         # Visible Nitro integration
├── nitro.config.ts         # Visible config
└── core.ts                 # Framework code
```

### Production (v1.0)
```
@hexane/core/               # npm package
├── cli/                    # Hidden from users
├── runtime/                # Public API
└── nitro/                  # Hidden integration

my-app/                     # User's project
├── app/                    # Only user code
└── hexane.config.ts       # Optional
```

## User Migration Example

### Before (POC)
```typescript
// User had to understand Nitro
// routes/[...].ts existed in their project
npm run dev  // Actually runs nitro dev
```

### After (v1.0)
```typescript
// User never sees Nitro
// No routes/ directory
npm run dev  // Runs hexane dev (which manages Nitro internally)
```

## Advantages of This Architecture

1. **Separation of Concerns**
   - User code: Business logic
   - Framework code: Integration & tooling
   - Clear boundaries

2. **Future-Proof**
   - Can switch from Nitro to another runtime
   - User code remains unchanged
   - Just update framework package

3. **Better DX**
   - Single source of truth (`@hexane/core`)
   - No configuration sprawl
   - Consistent across projects

4. **Easier Debugging**
   - Framework issues isolated
   - User code is pure TypeScript
   - Clear error messages from CLI

5. **Ecosystem Ready**
   - Plugins hook into CLI
   - Starters/templates just need `app/`
   - Easy to create tooling

## Technical Considerations

### Virtual Modules
- Use Nitro's virtual module system
- Generate handler code at runtime
- No files written to disk

### TypeScript Support
- Re-export types from `@hexane/core`
- User gets full type inference
- No need to reference framework files

### HMR Support
- Watch `app/` directory
- Rebuild on changes
- Full hot module replacement

### Build Optimization
- Tree-shake unused features
- Bundle only what's needed
- Support code splitting

## Conclusion

This architecture provides the **cleanest possible abstraction** for users while giving the framework **maximum flexibility** to evolve. Users write pure, portable TypeScript in `app/`, and Hexane handles all deployment complexity behind a simple CLI.

The POC demonstrates this is technically feasible. The next step is packaging it as `@hexane/core` with a CLI that implements this vision.

---

**Status: Ready for Implementation**
**Target: Hexane v1.0**
**Estimated Effort: 2-3 weeks**
