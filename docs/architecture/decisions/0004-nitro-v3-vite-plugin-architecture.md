# ADR-0004: Nitro v3 and Vite Plugin Architecture

## Status

**Accepted** - 2025-11-23

## Context

Nitro v3 (currently in alpha) introduces significant architectural changes that affect how frameworks should integrate with it. Most notably:

1. **Vite Plugin Architecture**: Nitro v3 becomes a Vite plugin rather than a standalone build tool
2. **Programmatic Handler Registration**: Handlers can now be defined directly in config via the `handlers` array
3. **Modern Tooling Integration**: Deeper integration with Vite's ecosystem and plugin system

This represents a fundamental shift from Nitro v2's architecture, where integration primarily happened through file-based routing with catch-all routes (documented in ADR-0002).

### Requirements

1. **Modern Foundation**: Build on latest architecture to avoid technical debt
2. **Clean Integration**: Leverage Nitro v3's programmatic handler registration
3. **Future-Proof**: Avoid patterns that will need migration
4. **Developer Experience**: Maintain excellent DX with Vite tooling
5. **Simplicity**: Start with minimal packages, expand as needed

### Problem

Should we continue with the Nitro v2 integration strategy (catch-all routes + CLI abstraction), or adopt a fundamentally different architecture that embraces Nitro v3's Vite plugin model?

## Decision

We will **target Nitro v3 and h3 v2 from the start** and build Hexane as a **Vite plugin that wraps Nitro**, focusing initially on only two core packages:

```
packages/
├── core/   # @hexane/core - Runtime (modules, DI, decorators, metadata)
└── vite/   # @hexane/vite - Vite plugin (dev/build, Nitro integration)
```

**No CLI package initially** - Vite handles dev/build, and production runs Nitro's generated output directly.

### Architecture

```
┌─────────────────────────────────────────┐
│          User Project                    │
│                                          │
│  vite.config.ts:                         │
│    plugins: [                            │
│      hexane({                            │
│        modules: [AppModule]              │
│      })                                  │
│    ]                                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     @hexane/vite (Vite Plugin)           │
│  - Configures Nitro plugin               │
│  - Generates handlers from modules       │
│  - Provides HMR for module changes       │
│  - Manages dev/build lifecycle           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Nitro v3 (as Vite Plugin)           │
│  - Receives handlers config              │
│  - Manages server lifecycle              │
│  - Handles deployment builds             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              h3 v2                       │
│  - Request handling                      │
│  - Routing                               │
│  - Middleware                            │
└─────────────────────────────────────────┘
```

### Key Implementation Strategy

#### 1. Hexane Vite Plugin

```typescript
// @hexane/vite
import type { Plugin } from 'vite'
import { nitro } from 'nitro/vite'

export function hexane(options: HexaneOptions): Plugin {
  return {
    name: 'hexane',

    config(config) {
      // Generate handlers from Hexane modules
      const handlers = generateHandlersFromModules(options.modules)

      // Configure Nitro plugin with programmatic handlers
      config.plugins = config.plugins || []
      config.plugins.push(
        nitro({
          handlers,
          // Other Nitro config derived from Hexane setup
        })
      )

      return config
    },

    // Handle HMR for module changes
    handleHotUpdate({ file, server }) {
      if (isModuleFile(file)) {
        // Regenerate handlers and restart
        server.restart()
      }
    }
  }
}

function generateHandlersFromModules(modules: ModuleDefinition[]) {
  const routes = traverseModuleTree(modules)

  return routes.map(route => ({
    route: route.path,
    method: route.method,
    handler: createH3Handler(route)
  }))
}
```

#### 2. User Configuration

```typescript
import { hexane } from '@hexane/vite'
// vite.config.ts - User's only config file
import { defineConfig } from 'vite'
import { AppModule } from './app/app.module'

export default defineConfig({
  plugins: [
    hexane({
      modules: [AppModule]
    })
  ]
})
```

#### 3. Development & Build

```bash
# Development
vite dev          # Handled by Vite + Hexane plugin + Nitro plugin

# Build
vite build        # Generates .output/ with Nitro

# Production
node .output/server/index.mjs  # Run Nitro's output
```

## Rationale

### Why Target Nitro v3 Now?

| Consideration | v2 Strategy | v3 Strategy | Decision |
|--------------|-------------|-------------|----------|
| **Stability** | ✅ Production ready | ⚠️ Alpha | v3 - new framework can adopt alpha |
| **Architecture** | File-based workaround | Native programmatic | v3 - cleaner integration |
| **Migration Cost** | None now, high later | Higher now, none later | v3 - pay cost once |
| **Technical Debt** | Builds up | Avoided | v3 - start clean |
| **Ecosystem** | Mature | Growing | v3 - we're early anyway |

**Verdict**: Since Hexane is new, we can afford to build on alpha. Avoiding migration work later is worth the stability risk now.

### Why Vite Plugin Architecture?

**Pros**:
- ✅ Single config file (`vite.config.ts`)
- ✅ Native Vite tooling integration
- ✅ Programmatic handler registration (no file-based workaround)
- ✅ Natural fit with Nitro v3's architecture
- ✅ Excellent HMR capabilities
- ✅ Full control over build pipeline
- ✅ Industry standard pattern (modern frameworks)

**Cons**:
- ⚠️ More complex plugin implementation
- ⚠️ Requires understanding Vite plugin API
- ⚠️ Framework coupled to Vite (acceptable trade-off)

**Verdict**: The benefits far outweigh the complexity. Vite is the modern standard.

### Why No CLI Initially?

**CLI tasks vs alternatives**:

| Task | Traditional CLI | With Vite Plugin | Needed Now? |
|------|----------------|------------------|-------------|
| Dev server | `hexane dev` | `vite dev` | ❌ No - Vite does it |
| Build | `hexane build` | `vite build` | ❌ No - Vite does it |
| Production | `hexane start` | `node .output/...` | ❌ No - simple script |
| Scaffolding | `hexane new` | `npm create hexane` | ⚠️ Later - use create-hexane |
| Code generation | `hexane generate` | - | ⚠️ Later - when mature |

**Verdict**: CLI is not needed for core functionality. Add later if/when code generation becomes valuable.

### Why Two Packages Only?

**Minimal viable architecture**:

```
@hexane/core    # Runtime: modules, DI, decorators, type system
@hexane/vite    # Integration: Vite plugin, Nitro config generation
```

**What's excluded initially**:
- ❌ `@hexane/cli` - Not needed (Vite handles dev/build)
- ❌ `create-hexane` - Can wait until patterns stabilize
- ❌ Testing packages - Can wait for framework maturity
- ❌ Additional integrations - Add as needed

**Verdict**: Start lean, grow organically based on real needs.

## Consequences

### Positive

1. **Modern Foundation**
   - Built on latest architecture (Nitro v3, h3 v2, Vite)
   - No technical debt from day one
   - Programmatic handlers instead of file-based workarounds

2. **Clean Integration**
   - Single config file for users
   - Natural Vite plugin composition
   - Direct handler registration via Nitro v3 API

3. **Better Developer Experience**
   - Leverage Vite's excellent tooling
   - Fast HMR for module changes
   - Familiar workflow for modern developers

4. **Simplified Architecture**
   - No CLI complexity initially
   - Two focused packages
   - Clear separation of concerns

5. **Future Flexibility**
   - Can add CLI later if needed
   - Can extend with more packages
   - Not locked into v2 patterns

### Negative

1. **Alpha Stability Risk**
   - Nitro v3 is in alpha
   - APIs may change
   - Potential bugs in Nitro/h3
   - **Mitigation**: Pin versions, contribute fixes upstream, maintain compatibility layer if needed

2. **Learning Curve**
   - Need to understand Vite plugin API
   - More complex than simple CLI
   - **Mitigation**: Good documentation, examples, reference implementations

3. **Vite Dependency**
   - Framework coupled to Vite
   - **Mitigation**: Acceptable trade-off; Vite is industry standard

### Neutral

1. **Different from Original Plan**
   - ADR-0002 planned catch-all routes + CLI
   - This is fundamentally different
   - **Note**: This supersedes ADR-0002's implementation strategy while keeping its insights about integration points

2. **Ecosystem Maturity**
   - Nitro v3 ecosystem still growing
   - Fewer examples and patterns
   - **Opportunity**: Help shape best practices

## Alternatives Considered

### Alternative 1: Continue with Nitro v2 Strategy (ADR-0002)

**What**: Implement catch-all route pattern + CLI abstraction as planned

**Pros**:
- ✅ Proven pattern (validated in POC)
- ✅ Stable Nitro v2 foundation
- ✅ Clear implementation path

**Cons**:
- ❌ Will need migration to v3 later
- ❌ File-based workaround (indirect)
- ❌ More complex CLI required
- ❌ Building on old architecture

**Why rejected**: Building on v2 creates technical debt we'll pay later. Better to start with v3.

### Alternative 2: Nitro Plugin (Not Vite Plugin)

**What**: Build Hexane as a Nitro plugin, not Vite plugin

```typescript
// nitro.config.ts
export default defineNitroConfig({
  plugins: [hexane({ modules: [AppModule] })]
})
```

**Pros**:
- ✅ Clearer separation (Nitro level)
- ✅ Users still have Vite control

**Cons**:
- ❌ Users manage two configs (vite + nitro)
- ❌ Less control over full stack
- ❌ Nitro plugin API still maturing

**Why rejected**: Since Nitro v3 is a Vite plugin, going one level up (Vite plugin) provides better control and simpler user DX.

### Alternative 3: Standalone (Hexane CLI, Optional Vite)

**What**: Hexane manages everything, optionally uses Vite internally

```typescript
// hexane.config.ts
export default { modules: [AppModule] }
```

```bash
hexane dev    # Manages Vite + Nitro internally
hexane build
```

**Pros**:
- ✅ Maximum abstraction
- ✅ Simplest for users
- ✅ Full control

**Cons**:
- ❌ Users lose Vite config flexibility
- ❌ More "magic" (can be frustrating)
- ❌ Complex CLI implementation
- ❌ Goes against Vite/Nitro philosophy

**Why rejected**: Over-abstracts. Modern developers expect Vite access. CLI can come later if needed.

### Alternative 4: Wait for Nitro v3 Stable

**What**: Implement v2 strategy now, migrate to v3 when stable

**Pros**:
- ✅ Avoid alpha stability issues
- ✅ Proven ecosystem

**Cons**:
- ❌ Guaranteed migration work
- ❌ Technical debt from day one
- ❌ Users also need migration
- ❌ Wasted implementation effort

**Why rejected**: Hexane is new. We can afford alpha. Migration cost later > stability risk now.

## Verification Plan

### Phase 1: Minimal POC ⏳ (Next)

Goal: Validate Nitro v3 integration basics

```bash
# Test Nitro v3 + Vite plugin pattern
1. Create minimal Vite plugin
2. Configure Nitro v3 with programmatic handlers
3. Verify dev server works
4. Verify build works
5. Verify production run works
```

**Success Criteria**:
- ✅ Handlers registered programmatically
- ✅ Routes accessible in dev and production
- ✅ Vite HMR works
- ✅ Build generates valid output

### Phase 2: Core Package ⏳

Goal: Implement `@hexane/core` runtime

- Module system (from POC)
- Decorator metadata collection
- DI container
- Route collection and traversal
- h3 handler generation

### Phase 3: Vite Plugin ⏳

Goal: Implement `@hexane/vite` plugin

- Vite plugin scaffold
- Nitro configuration generation
- Handler registration from modules
- HMR for module changes
- TypeScript integration

### Phase 4: Validation ⏳

Goal: Build real example application

- Complex module tree
- Multiple controllers
- Dependency injection
- Guards and middleware
- Production deployment

## Migration from ADR-0002

### What Changes

| Aspect | ADR-0002 (v2) | ADR-0004 (v3) |
|--------|---------------|---------------|
| **Nitro Version** | v2 | v3 |
| **Integration** | Catch-all route file | Vite plugin with handlers config |
| **Build Tool** | Nitro CLI | Vite |
| **User Config** | Multiple files | Single vite.config.ts |
| **CLI** | Required | Not needed initially |
| **Handler Reg** | File-based indirect | Programmatic direct |

### What Stays

- ✅ Module-based architecture
- ✅ Module tree traversal
- ✅ h3 handler generation
- ✅ Type safety throughout
- ✅ Deployment flexibility
- ✅ User code isolation (app/)

### Key Insight from ADR-0002

ADR-0002's core insight remains valid: **plugins don't work for route registration** (timing issues).

**How this applies to v3**:
- We don't use Nitro plugins for routes
- We use Vite plugin to configure Nitro's `handlers` array at config time
- This happens BEFORE Nitro initializes (correct timing)
- Nitro plugins still useful for features (storage, cache, etc.)

## Implementation Plan

### Week 1: Nitro v3 Validation
- [ ] Study Nitro v3 docs and API
- [ ] Create minimal Vite + Nitro v3 POC
- [ ] Validate programmatic handler registration
- [ ] Test dev/build/production workflow
- [ ] Document findings

### Week 2-3: Core Package
- [ ] Port module system from POC
- [ ] Implement decorator system
- [ ] Build DI container
- [ ] Create route collection
- [ ] Generate h3 handlers

### Week 4-5: Vite Plugin
- [ ] Implement Vite plugin scaffold
- [ ] Configure Nitro from Hexane modules
- [ ] Generate handlers array
- [ ] Implement HMR
- [ ] Add TypeScript support

### Week 6: Testing & Refinement
- [ ] Build example application
- [ ] Test edge cases
- [ ] Performance testing
- [ ] Documentation
- [ ] API refinement

## References

### Related ADRs
- **ADR-0002: Nitro Integration Strategy** - v2 strategy, insights still valid
- **ADR-0003: Module System and Circular Dependencies** - Core architecture remains same

### Nitro v3 Documentation
- Main docs: https://v3.nitro.build/docs
- Handlers config: https://v3.nitro.build/config#handlers
- Vite integration: https://v3.nitro.build/ (general architecture)

### Industry Examples
- **Next.js**: Uses Webpack/Turbopack, not Vite (different approach)
- **Remix**: Vite plugin architecture (similar pattern)
- **SvelteKit**: Vite plugin + adapters (similar pattern)
- **Analog (Angular)**: Vite + Nitro integration (close parallel)

### POC Location
- **Previous POC**: `poc/module-tree/` (Nitro v2 validation)
- **Next POC**: `poc/nitro-v3-vite/` (to be created)

## Notes

### Key Decisions

1. **Target alpha**: Acceptable risk for new framework
2. **Vite plugin**: Embrace modern tooling
3. **No CLI initially**: YAGNI - add when needed
4. **Two packages**: Start minimal, grow organic

### Success Metrics

How we'll know this was the right choice:

- ✅ Cleaner integration code than v2 strategy
- ✅ Better DX (Vite tooling, HMR)
- ✅ Programmatic handlers work reliably
- ✅ Easier to extend and maintain
- ✅ No need for file-based workarounds

### Risks & Mitigation

**Risk 1: Nitro v3 API changes**
- Mitigation: Pin versions, maintain compatibility layer, contribute upstream

**Risk 2: Alpha bugs**
- Mitigation: Report upstream, work with Nitro team, fallback patches

**Risk 3: Limited examples**
- Mitigation: Document well, be part of early ecosystem

**Risk 4: Vite coupling**
- Mitigation: Acceptable; Vite is standard, could abstract later if needed

### Future Considerations

1. **CLI Package**: Add when code generation becomes valuable
2. **create-hexane**: Add when patterns stabilize
3. **Testing Utilities**: Add when framework matures
4. **Additional Integrations**: Database, auth, etc. (later)
5. **Nitro v4+**: Will likely be easier to adapt from v3 than v2

---

**Decision made by:** Core team
**Date:** 2025-11-23
**Status:** Accepted, implementation starting
**Supersedes:** ADR-0002 implementation strategy (architectural insights retained)
**Next Step:** Nitro v3 validation POC
