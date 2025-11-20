# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Hexane framework.

## What are ADRs?

Architecture Decision Records document significant architectural decisions made during the development of Hexane. Each ADR captures:

- **Context**: Why the decision was needed
- **Decision**: What was decided
- **Consequences**: What follows from the decision
- **Alternatives**: What other options were considered

## Format

Each ADR follows this structure:

```markdown
# ADR-NNNN: Title

**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Date**: YYYY-MM-DD
**Deciders**: Who made this decision

## Context
Why this decision is needed

## Decision
What we decided

## Consequences
What follows from this decision

## Alternatives Considered
What other options we looked at and why we rejected them
```

## ADR Index

### Core Patterns

- [ADR-0001: Guards and Extractors Pattern](./0001-guards-and-extractors-pattern.md) - **Accepted** - Establishes the foundational pattern for request handling

### Implementation (Planned)

- **ADR-0002**: Fluent API Implementation _(pending)_
- **ADR-0003**: Handler Parameter Type Inference _(pending)_
- **ADR-0004**: Custom Extension Points _(pending)_
- **ADR-0005**: Error Handling Strategy _(pending)_
- **ADR-0006**: Response Interceptor Pattern _(pending)_

## When to Write an ADR

Create an ADR when making decisions about:

- Core architectural patterns
- API design choices
- Technology selections
- Breaking changes
- Performance trade-offs
- Security approaches

## When NOT to Write an ADR

Don't create ADRs for:

- Implementation details that don't affect the API
- Bug fixes
- Refactoring that doesn't change behavior
- Documentation updates
- Minor optimizations

## Process

1. **Propose**: Create an ADR with status "Proposed"
2. **Discuss**: Review with team (via PR or discussion)
3. **Decide**: Update status to "Accepted" or "Rejected"
4. **Implement**: Build the feature following the ADR
5. **Update**: If decision changes, either update the ADR or create a new one that supersedes it

## Status Meanings

- **Proposed**: Under consideration
- **Accepted**: Decision made and active
- **Deprecated**: No longer recommended but not yet removed
- **Superseded**: Replaced by another ADR (link to the new one)
- **Rejected**: Considered but not adopted

## Tips for Writing Good ADRs

### Do:
- ✅ Focus on one decision per ADR
- ✅ Explain the context and constraints
- ✅ List alternatives considered
- ✅ Be clear about trade-offs
- ✅ Include concrete examples
- ✅ Link to related POCs or documentation

### Don't:
- ❌ Try to cover multiple unrelated decisions
- ❌ Skip the alternatives section
- ❌ Use vague language
- ❌ Leave out the "why"
- ❌ Forget to update the index

## References

- [Architecture Decision Records (ADR) by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)

---

> 💡 **Remember**: ADRs are living documents. Update them when decisions change, but keep the history visible.
