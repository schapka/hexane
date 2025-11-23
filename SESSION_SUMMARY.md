# Session Summary - 2025-11-23

## Major Architectural Decision

**ADR-0004: Nitro v3 and Vite Plugin Architecture** - Documented the decision to target Nitro v3 (alpha) with Hexane as a Vite plugin, eliminating the need for a CLI package initially.

## Key Decisions Made

### 1. Target Nitro v3 + h3 v2 from Start

- **Why**: Build on modern architecture to avoid technical debt and future migration work
- **Trade-off**: Accept alpha stability risk (acceptable for new framework)
- **Benefit**: Programmatic handler registration via `handlers` config (cleaner than catch-all routes)

### 2. Hexane as Vite Plugin (Not CLI)

```
User: vite.config.ts with hexane() plugin
  ↓
@hexane/vite: Generates handlers from modules, configures Nitro
  ↓
Nitro v3 (as Vite plugin): Server lifecycle
  ↓
h3 v2: Request handling
```

**Benefits**:
- Single config file for users (`vite.config.ts`)
- Programmatic handler registration (no file-based workarounds)
- Leverage Vite's tooling and HMR
- Natural integration with Nitro v3's architecture

### 3. Two-Package Structure (Minimal)

```
packages/
├── core/   # @hexane/core - Runtime (modules, DI, decorators, metadata)
└── vite/   # @hexane/vite - Vite plugin (integration with Nitro v3)
```

**No CLI package initially**:
- Vite handles `dev` and `build` commands
- Production runs Nitro's output directly: `node .output/server/index.mjs`
- CLI can be added later if/when needed (code generation, etc.)

### 4. User Experience

```typescript
import { hexane } from '@hexane/vite'
// vite.config.ts - Single config file
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

```bash
# Development
vite dev

# Build
vite build

# Production
node .output/server/index.mjs
```

## What Changed from Previous Plan (ADR-0002)

| Aspect | v2 Strategy | v3 Strategy |
|--------|-------------|-------------|
| **Nitro Version** | v2 | v3 (alpha) |
| **Integration** | Catch-all route file | Vite plugin with handlers config |
| **Build Tool** | Nitro CLI | Vite |
| **User Config** | Multiple files | Single vite.config.ts |
| **CLI** | Required | Not needed initially |
| **Handler Reg** | File-based indirect | Programmatic direct |

## Documentation Created

1. **ADR-0004**: `/docs/architecture/decisions/0004-nitro-v3-vite-plugin-architecture.md`
   - Comprehensive decision document
   - Rationale for all major choices
   - Alternatives considered and rejected
   - Verification plan and implementation roadmap

2. **Updated ADR Index**: `/docs/architecture/decisions/README.md`
   - Added ADR-0004 to core architecture section

3. **Updated Context**: `/.ai/context.md`
   - Current status reflects new architecture
   - Foundation updated (Vite, Nitro v3, h3 v2)
   - Package structure documented
   - Nitro v3 integration architecture explained
   - Implementation status updated
   - References updated
   - AI assistant notes expanded

## Current State

### Workspace Structure

```
hexane/
├── packages/
│   ├── core/          # Scaffolded (minimal)
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── rolldown.config.ts
│   │   └── eslint.config.mjs
│   └── vite/          # Scaffolded (minimal - will be renamed from cli)
│       ├── src/index.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── rolldown.config.ts
│       └── eslint.config.mjs
├── docs/
│   └── architecture/
│       └── decisions/
│           ├── 0001-guards-and-extractors-pattern.md
│           ├── 0002-nitro-integration-strategy.md
│           ├── 0003-module-system-and-circular-dependencies.md
│           └── 0004-nitro-v3-vite-plugin-architecture.md ⭐ NEW
├── poc/
│   └── module-tree/   # Nitro v2 POC (reference)
├── package.json       # Root workspace with pnpm catalogs
├── pnpm-workspace.yaml
└── .ai/context.md     # Updated ⭐
```

### Next Steps

As documented in ADR-0004, the implementation plan is:

**Phase 1: Nitro v3 Validation** (Next)
- [ ] Study Nitro v3 docs and API
- [ ] Create minimal Vite + Nitro v3 POC
- [ ] Validate programmatic handler registration
- [ ] Test dev/build/production workflow
- [ ] Document findings

**Phase 2: Core Package**
- [ ] Port module system from POC
- [ ] Implement decorator system
- [ ] Build DI container
- [ ] Create route collection
- [ ] Generate h3 handlers

**Phase 3: Vite Plugin**
- [ ] Implement Vite plugin scaffold
- [ ] Configure Nitro from Hexane modules
- [ ] Generate handlers array
- [ ] Implement HMR
- [ ] Add TypeScript support

**Phase 4: Testing & Refinement**
- [ ] Build example application
- [ ] Test edge cases
- [ ] Performance testing
- [ ] Documentation
- [ ] API refinement

## Before Starting Implementation

You'll need to:

1. **Rename/adjust packages/cli to packages/vite**
   - Update package name to `@hexane/vite`
   - Remove bin entry from package.json
   - Update description to "Hexane framework Vite plugin"

2. **Update pnpm-workspace catalog** if needed
   - Add any Vite-specific dependencies
   - Consider adding Nitro v3 alpha to catalog

3. **Create Nitro v3 POC** (recommended first step)
   - Validate that Nitro v3 alpha is stable enough
   - Test programmatic handler registration
   - Verify Vite plugin integration works as expected
   - Document any issues or gotchas

## References

- **ADR-0004**: Full architectural decision with rationale
- **Nitro v3 Docs**: https://v3.nitro.build/docs
- **Nitro v3 Handlers Config**: https://v3.nitro.build/config#handlers
- **Context Document**: `.ai/context.md` (comprehensive framework context)

## Questions to Consider

Before moving forward, you might want to think about:

1. Should we create the Nitro v3 POC in `poc/nitro-v3-vite/`?
2. Any specific features from Nitro v3 we want to validate first?
3. Do we need to test deployment targets with v3?
4. Any concerns about alpha stability that need investigation?

---

**Status**: Architecture documented, ready to begin implementation
**Next**: Adjust workspace structure, then create Nitro v3 validation POC
**Date**: 2025-11-23
