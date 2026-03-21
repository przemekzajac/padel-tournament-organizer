# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project Overview

This is the `claude-code-test` repository owned by **przemekzajac**. It serves as a workspace for experimenting with Claude Code capabilities.

## Communication Style

- Be concise and direct. Skip preamble.
- When uncertain, ask rather than assume.
- Explain trade-offs when presenting options.

## Code Standards

- Write clean, readable code. Favor clarity over cleverness.
- Keep functions small and single-purpose.
- Use meaningful names for variables, functions, and files.
- Add comments only where the intent isn't obvious from the code itself.
- Follow the conventions already established in the codebase — match existing style before introducing new patterns.

## Git Workflow

- Use descriptive commit messages that explain **why**, not just what.
- Keep commits focused — one logical change per commit.
- Always work on feature branches; never push directly to `main`.

## Testing

- Write tests for new functionality.
- Run existing tests before committing to avoid regressions.

## When Adding Dependencies

- Prefer well-maintained, widely-used libraries.
- Justify new dependencies — don't add a library for something trivially implementable.

## File Organization

- Keep the project structure flat and simple until complexity demands otherwise.
- Group related files together by feature or domain.
