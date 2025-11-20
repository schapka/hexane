# AI Context Directory

This directory contains context documents optimized for AI assistants (GitHub Copilot, Cursor, Claude, ChatGPT, etc.) to understand and contribute to the Hexane framework.

## Purpose

These files help AI assistants:

- Understand the project's architecture and design decisions
- Follow established coding patterns
- Avoid anti-patterns (like experimental decorators)
- Provide consistent, high-quality suggestions
- Stay aligned with the project's vision

## Files

### `context.md` (Primary Document)

The main context file containing:

- Project overview and mission
- Technical architecture
- Design principles
- Code patterns and examples
- Implementation status
- Common tasks and workflows

### `implementation.md` (Coming Soon)

Detailed implementation guide with:

- Step-by-step patterns
- Complex code examples
- Edge cases and solutions
- Performance considerations

### `examples.md` (Coming Soon)

Working code snippets for:

- Common patterns
- API usage
- Testing approaches
- Migration guides

## How to Use

### With Cursor

1. **Automatic**: Cursor automatically reads these files when present
2. **Manual Reference**: Use `@context.md` in your prompt to explicitly reference

```
@context.md How should I implement a new extractor for cookies?
```

### With GitHub Copilot Chat

Reference the context file in your questions:

```
Look at .ai/context.md and suggest how to implement parameter-based DI
```

### With Claude or ChatGPT

1. **New Session**: Start by sharing the entire `context.md` file
2. **Specific Task**: Include relevant sections from context
3. **Code Review**: Share context + your code for review

Example prompt:

```
I'm working on the Hexane framework. Here's the project context:
[paste context.md]

Now I need help implementing the extractor pattern for query parameters.
```

### With Aider or Other CLI Tools

```bash
# Include context in aider session
aider --read .ai/context.md src/core/extractors.ts

# Or reference in your prompt
# "Following the patterns in .ai/context.md, implement..."
```

## For Contributors

### When to Update Context

Update these files when:

- Making significant architecture decisions
- Establishing new patterns
- Deprecating old approaches
- Adding major features
- Changing core principles

### Update Process

1. **Before Major Changes**: Update context FIRST to align AI assistance
2. **Create ADR**: Document the decision in `/docs/architecture/decisions/`
3. **Update Context**: Reflect changes in `context.md`
4. **Test with AI**: Verify AI gives correct suggestions with new context

### What Makes Good Context

✅ **DO Include:**

- Concrete code examples
- Clear patterns to follow
- Explicit anti-patterns to avoid
- Current implementation status
- Technical decisions and rationale

❌ **DON'T Include:**

- Outdated information
- Ambiguous guidelines
- Implementation details that change frequently
- Large code blocks (link instead)
- Sensitive information

## Integration with Development Workflow

### 1. Starting New Feature

```bash
# Review context before starting
cat .ai/context.md | grep -A 10 "Common Tasks"

# Use AI with context for scaffolding
"Based on .ai/context.md, create a new module for authentication"
```

### 2. Code Review

```bash
# Have AI review your code against project patterns
"Review this code against the patterns in .ai/context.md"
```

### 3. Problem Solving

```bash
# Get help that follows project conventions
"Following Hexane's extractor pattern, how do I handle file uploads?"
```

### 4. Documentation

```bash
# Generate docs that match project style
"Create API documentation following the style in .ai/context.md"
```

## Best Practices

### 1. **Keep Context Fresh**

Review monthly and update as needed

### 2. **Be Explicit About Anti-Patterns**

Tell AI what NOT to do (e.g., no decorators)

### 3. **Include Examples**

Show concrete implementations, not just descriptions

### 4. **Version Significant Changes**

Note when major patterns change with dates

### 5. **Test AI Responses**

Periodically verify AI gives good suggestions with current context

## Tool-Specific Configuration

### Cursor Settings

`.cursor/settings.json`:

```json
{
  "context": {
    "include": [".ai/context.md"],
    "autoInclude": true
  }
}
```

### VS Code Copilot

`.vscode/settings.json`:

```json
{
  "github.copilot.advanced": {
    "contextFiles": [".ai/context.md"]
  }
}
```

## Examples of Good Prompts

### ✅ Good: Specific with Context Reference

```
Following the extractor pattern in .ai/context.md, create a new
extractor for validating JWT tokens from headers
```

### ✅ Good: Building on Established Patterns

```
Using Hexane's parameter-based DI pattern, how do I inject
a service that depends on configuration?
```

### ❌ Bad: Ignoring Project Patterns

```
Add decorators for validation to this controller
```

(Hexane explicitly avoids decorators)

### ❌ Bad: Too Vague

```
Make this better
```

## Troubleshooting

### AI Suggests Decorators

→ Context might be missing or AI didn't read it. Re-share context.md

### AI Uses Wrong Patterns

→ Be explicit: "Following Hexane's patterns in .ai/context.md..."

### Inconsistent Suggestions

→ Check if context is up-to-date with recent decisions

### AI Doesn't Understand Custom Terms

→ Add to Glossary section in context.md

## Contributing to AI Context

1. **Open Issue**: Discuss what needs updating
2. **Update Context**: Make changes to relevant files
3. **Test**: Verify AI gives correct suggestions
4. **PR**: Submit with examples of AI interactions

## Future Enhancements

- [ ] Tool-specific context files (cursor.md, copilot.md)
- [ ] Context validation script
- [ ] Auto-generation from code patterns
- [ ] Version history for major changes
- [ ] Context complexity metrics

---

> 💡 **Tip**: The better our context, the better AI can help. Treat these files as first-class documentation!
