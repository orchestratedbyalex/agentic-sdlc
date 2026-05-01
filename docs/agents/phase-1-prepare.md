---
id: "PHASE-PREPARE"
phase: "prepare"
phase_number: 1
trigger: "New repository with no docs/requirements/ directory"
estimated_agents: 2
evidence: "proven"
---

# Phase 1: Prepare

Set up the repository for agentic SDLC work.

## Prerequisites

- A git repository with source code
- No existing `docs/requirements/` or `docs/design/` directories

## Agent 1: Codebase Explorer

- **Type:** explore
- **Count:** 1
- **Parallelism:** standalone
- **Depends on:** nothing
- **Input files:** entire repository
- **Output:** understanding of codebase (passed to Agent 2 via conversation context)
- **Validation:** none (informational)

### Full Prompt

```
Analyze this codebase thoroughly. Read:
1. package.json (or equivalent manifest) — project name, scripts, dependencies, engines
2. README.md — purpose, usage, features
3. Language/compiler config (tsconfig.json, pyproject.toml, Cargo.toml, etc.)
4. Source files — list all modules and their purposes
5. Test files — list all test files and identify the test framework
6. CI/CD config (.github/workflows/, .gitlab-ci.yml, Jenkinsfile, etc.)
7. Any existing .cursorrules, .github/copilot-instructions.md, or CLAUDE.md

Report:
- Project name, description, and language
- Build, test, lint, and format commands
- High-level architecture (main modules and their relationships)
- Key dependencies and what they provide
- Engine/platform requirements
```

## Agent 2: CLAUDE.md Author

- **Type:** write
- **Count:** 1
- **Parallelism:** standalone
- **Depends on:** Agent 1
- **Input files:** findings from Agent 1
- **Output files:** `CLAUDE.md` at repository root
- **Validation:** file exists and contains build/test commands + architecture overview

### Full Prompt

```
Create a CLAUDE.md file at the repository root. This file provides guidance
to future Claude Code sessions working in this repository.

Include:
1. Build, test, lint, format commands (including how to run a single test)
2. High-level architecture — the "big picture" that requires reading multiple
   files to understand
3. Key dependencies and what they provide

Do NOT include:
- Generic development practices
- Obvious instructions
- Every file path (can be discovered)
- Security warnings that apply to all projects

Prefix the file with:
# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.
```

## Completion

Update `docs/requirements/sdlc-metadata.yml`:
```yaml
prepare:
  status: "completed"
```
