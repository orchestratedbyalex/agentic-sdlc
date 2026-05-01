---
id: "PHASE-DEFINE"
phase: "define"
phase_number: 2
trigger: "sdlc-metadata.yml shows prepare.status=completed AND define.status=pending"
estimated_agents: 7
evidence: "proven"
standards:
  - "ISO/IEC/IEEE 12207:2017 — Stakeholder Needs + System/Software Requirements Definition"
  - "ISO/IEC 25010 — Software product quality model (Quality Lifecycle anchor)"
  - "ISO/IEC 27001 — Information security management (Security Lifecycle anchor)"
  - "Four cross-cutting SDLC focus tracks (Quality, Security, Eco-efficiency, AI)"
---

# Phase 2: Define

Reverse-engineer requirements from the existing codebase and produce Requirements as Code.

## Prerequisites

- Phase 1 (Prepare) completed
- `CLAUDE.md` exists at repository root
- `docs/requirements/` directory does NOT yet exist

## Setup (before agents)

Create the directory structure:
```bash
mkdir -p docs/requirements/{functional,nonfunctional,user-stories}
```

Write `docs/requirements/README.md` and `docs/requirements/sdlc-metadata.yml` (see existing files for schema).

---

## Agent 1: Reverse Engineer — Source Code Analyst

- **Type:** explore
- **Count:** 1 (of 3 parallel explore agents)
- **Parallelism:** runs simultaneously with Agents 2 and 3
- **Depends on:** setup complete
- **Input files:** all source files (discover from CLAUDE.md or project structure)
- **Output:** raw findings (passed to author agents)
- **Validation:** none (informational)

### Full Prompt

```
Analyze this repository to reverse-engineer ALL functional requirements from
the existing codebase.

Read CLAUDE.md to identify the source directory structure, then read ALL
source modules.

For each exported function, class, or public API surface, identify:
1. Core Features — what it does and what requirement it fulfills
2. Public API surface — input/output contracts for all exported symbols
3. Configuration options — every user-configurable option and its behavior
4. Platform support — any platform-specific handling (OS, runtime, etc.)
5. Edge cases — what the code explicitly handles (invalid inputs, missing
   resources, option conflicts, boundary conditions)
6. Error handling — every throw/reject/error path with its condition and
   message

Be thorough. Report organized by category with specific file and line
references.
```

## Agent 2: Reverse Engineer — Test Analyst

- **Type:** explore
- **Count:** 1 (of 3 parallel explore agents)
- **Parallelism:** runs simultaneously with Agents 1 and 3
- **Depends on:** setup complete
- **Input files:** all test files (discover from CLAUDE.md or project structure)
- **Output:** raw findings (passed to author agents)
- **Validation:** none (informational)

### Full Prompt

```
Analyze the test suite of this repository to extract acceptance criteria and
user stories. Read package.json to identify the test framework and test
directory structure.

For each test file:
1. Read the file and identify what scenarios/behaviors it validates
2. Translate each test into a user-story-style requirement
   (As a developer, I want X so that Y)
3. Identify any NFR-related tests (performance, platform, error handling)

Read ALL test files. Organize output as a list of user stories grouped
by feature area. Include the test file name for each story.
```

## Agent 3: Reverse Engineer — NFR Analyst

- **Type:** explore
- **Count:** 1 (of 3 parallel explore agents)
- **Parallelism:** runs simultaneously with Agents 1 and 2
- **Depends on:** setup complete
- **Input files:** README.md, package.json, language/compiler config, CI/CD config, any benchmark or profiling scripts, changelog
- **Output:** raw findings (passed to author agents)
- **Validation:** none (informational)

### Full Prompt

```
Analyze this repository for non-functional requirements, project constraints,
and packaging/distribution details.

Read: README.md, package.json (or equivalent manifest), language/compiler
config files, CI/CD configuration, any benchmark or profiling scripts,
changelog or release notes, and CLAUDE.md.

Identify:
1. Performance requirements — claims made, how measured, benchmark setup
2. Compatibility — runtime versions, module formats, platform CI matrix
3. Quality — type checking strictness, linting rules, test coverage
   expectations
4. Distribution — build pipeline, output formats, bundling, type declarations
5. Security/Safety — input limits, DoS prevention, resource cleanup

Report organized by NFR category.
```

---

## Agent 4: Requirement Author — Functional Requirements

- **Type:** write
- **Count:** 1 (of 3 parallel author agents)
- **Parallelism:** runs simultaneously with Agents 5 and 6
- **Depends on:** Agents 1, 2, 3 (all explore agents must complete)
- **Input files:** findings from Agents 1-3, all source files (for verification)
- **Output files:** `docs/requirements/functional/FR-001-*.md` through `FR-NNN-*.md`
- **Validation:** YAML frontmatter parses, all source_files exist, all test_files exist

### Full Prompt

```
You are the Requirement Author agent. Write Functional Requirement documents
in docs/requirements/functional/.

Create one FR document per major feature area or public API surface discovered
by the explore agents. Number them sequentially starting from FR-001. Name
each file FR-NNN-<descriptive-slug>.md.

Each file uses this format:

---
id: "FR-XXX"
title: "Title"
type: "functional"
priority: "P0"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "requirement-author-agent"
reviewer: "requirement-reviewer-agent"
source_files: [...]
test_files: [...]
depends_on: [...]
implements: [...]
---

# FR-XXX: Title

## Description
What this requirement covers.

## Requirements

### FR-XXX.1: Sub-requirement title
Description using SHALL/SHOULD/MAY.

**Acceptance Criteria:**
- AC-1: ...
- AC-2: ...

## Traceability
| Sub-req | Test file | Source reference |
|---------|-----------|-----------------|

Guidelines for deciding FR boundaries:
- One FR per major exported module or public API entry point
- Separate FRs for distinct feature areas (e.g., configuration, error
  handling, platform support, caching)
- Each configuration option or user-facing behavior SHOULD appear as a
  sub-requirement (FR-XXX.N) with its own acceptance criteria
- Keep FRs focused: if a source file handles multiple concerns, split into
  multiple FRs

READ the actual source files to verify details before writing.
```

## Agent 5: Requirement Author — Non-Functional Requirements

- **Type:** write
- **Count:** 1 (of 3 parallel author agents)
- **Parallelism:** runs simultaneously with Agents 4 and 6
- **Depends on:** Agents 1, 2, 3
- **Input files:** findings from Agents 1-3, package.json, language/compiler config, CI/CD config
- **Output files:** `docs/requirements/nonfunctional/NFR-001-*.md` through `NFR-NNN-*.md`
- **Validation:** YAML frontmatter parses, verification_method field present

### Full Prompt

```
You are the Requirement Author agent. Write Non-Functional Requirement
documents in docs/requirements/nonfunctional/.

Create one NFR document per NFR category discovered by the explore agents.
Number them sequentially starting from NFR-001. Name each file
NFR-NNN-<descriptive-slug>.md.

Standard NFR categories to consider (include only those supported by evidence):
- Performance (benchmarks, caching, optimization)
- Compatibility (runtime versions, module formats, platform matrix)
- Code Quality (type checking, linting, test coverage)
- Security (input limits, resource cleanup, DoS prevention)
- API Consistency (interface contracts, result deduplication)
- Memory / Resource Safety (OOM prevention, cleanup, leak prevention)

EVERY NFR MUST be tagged with a `focus_track` per the four cross-cutting
SDLC focus tracks. Use these mappings:

| NFR category                           | focus_track |
|----------------------------------------|-------------|
| Performance, Compatibility, Code Quality, API Consistency, Reliability | quality |
| Security, Privacy, Compliance, DoS prevention, Resource limits | security |
| Energy use, carbon footprint, resource efficiency | eco |
| AI use, model governance, AI-driven productivity | ai |

The `focus_track` field anchors the NFR to its ISO standard:
- quality  → ISO/IEC 25010 (Software product quality model)
- security → ISO/IEC 27001 (Information security management)
- eco     → Green IT best practices
- ai      → Responsible AI / AI risk frameworks

Format:

---
id: "NFR-XXX"
title: "Title"
type: "nonfunctional"
category: "performance|compatibility|quality|security|reliability"
focus_track: "quality|security|eco|ai"
priority: "P0|P1|P2"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "requirement-author-agent"
reviewer: "requirement-reviewer-agent"
source_files: [...]
test_files: [...]
verification_method: "benchmark|ci-matrix|static-analysis|test|code-review"
---

READ source files for accurate details.
```

## Agent 6: Requirement Author — User Stories

- **Type:** write
- **Count:** 1 (of 3 parallel author agents)
- **Parallelism:** runs simultaneously with Agents 4 and 5
- **Depends on:** Agents 1, 2, 3
- **Input files:** findings from Agents 1-3
- **Output files:** `docs/requirements/user-stories/US-001-*.md` through `US-NNN-*.md`
- **Validation:** YAML frontmatter parses, implements_fr references valid FR IDs

### Full Prompt

```
You are the Requirement Author agent. Write User Story documents in
docs/requirements/user-stories/.

Create one US document per distinct user workflow or use case discovered by the
explore agents. Number them sequentially starting from US-001. Name each file
US-NNN-<descriptive-slug>.md.

Each user story SHOULD map to one or more FRs and optionally to NFRs. Derive
the persona from the project's target audience (read README.md to determine
who the users are).

Format:

---
id: "US-XXX"
title: "Title"
type: "user-story"
priority: "P0|P1|P2"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "requirement-author-agent"
reviewer: "requirement-reviewer-agent"
persona: "<persona discovered from README>"
implements_fr: ["FR-001"]
implements_nfr: ["NFR-001"]
test_files: [...]
epic: "<epic-name>"
---

# US-XXX: Title

## Story
As a **<persona>**, I want **<goal>**, so that **<benefit>**.

## Acceptance Criteria
- [ ] AC-1: ...

## Test Coverage
| Criterion | Test file | Description |
|-----------|-----------|-------------|

Guidelines for deciding US boundaries:
- One US per distinct user goal or workflow
- Each US SHOULD reference the FRs it exercises (implements_fr)
- Group related stories under an epic name
- Derive stories from both the test suite (what is tested) and the README
  (what is documented as a use case)
```

---

## Agent 7: Requirement Reviewer

- **Type:** validate
- **Count:** 1
- **Parallelism:** standalone (sequential after all authors)
- **Depends on:** Agents 4, 5, 6
- **Input files:** all files in `docs/requirements/`, all source files, all test files
- **Output:** PASS/FAIL report
- **On failure:** fix issues, then re-run this agent

### Full Prompt

```
You are the Requirement Reviewer agent. Validate ALL requirements documents
in docs/requirements/ against the review checklist.

Checks to perform:

1. DOCUMENT INVENTORY — Verify all expected files exist:
   - README.md, sdlc-metadata.yml
   - All FR documents in functional/
   - All NFR documents in nonfunctional/
   - All US documents in user-stories/
   - traceability-matrix.md, review-checklist.md

2. YAML FRONTMATTER — Verify required fields exist on every document.
   Specifically: every NFR MUST have a `focus_track` field with value
   in {quality, security, eco, ai} (the four SDLC focus tracks).

3. SOURCE FILE VALIDATION — Every source_files path must exist in the repo

4. TEST FILE VALIDATION — Every test_files path must exist in the repo

5. CROSS-REFERENCE VALIDATION:
   - FR implements references must match existing US IDs
   - US implements_fr references must match existing FR IDs
   - Bidirectional consistency (if an FR implements a US, then that US
     must reference the FR in its implements_fr)

6. COMPLETENESS:
   - Every exported function/class in the source has a corresponding FR
   - Every user-configurable option has acceptance criteria somewhere
   - Every test file maps to at least one requirement

7. QUALITY:
   - Requirements use SHALL/SHOULD/MAY language
   - User stories follow "As a... I want... so that..."
   - Acceptance criteria use AC-N: prefix

Report as: PASS items (brief), FAIL items (with file path and fix needed),
WARNINGS (non-critical).
```

---

## Post-Phase Tasks (after reviewer passes)

1. Write `docs/requirements/traceability-matrix.md` mapping all FRs, NFRs, and USs to test files and source files
2. Write `docs/requirements/review-checklist.md` with the validation protocol
3. Update `docs/requirements/sdlc-metadata.yml`:
```yaml
define:
  status: "completed"
  completed: "<today's date>"
```

## Coordination Summary

```
Agents 1, 2, 3 (explore) ──┐
    run in parallel          │
                             ▼
Agents 4, 5, 6 (author) ──┐
    run in parallel         │
                            ▼
Agent 7 (reviewer) ────────┐
    sequential              │
                            ▼
    Fix issues if needed
                            │
                            ▼
    Update sdlc-metadata.yml
```
