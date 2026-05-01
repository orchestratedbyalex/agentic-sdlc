---
id: "PHASE-DESIGN"
phase: "design"
phase_number: 3
trigger: "sdlc-metadata.yml shows define.status=completed AND design.status=pending"
estimated_agents: 6
evidence: "proven"
standards:
  - "ISO/IEC/IEEE 12207:2017 — Architecture Definition + Design Definition processes"
  - "IEEE 1016 — Software Design Descriptions (SDD)"
  - "Microsoft SDL — Design phase (threat modeling, attack surface analysis)"
  - "Michael Nygard 2011 — Documenting Architecture Decisions (ADRs)"
  - "SDLC focus tracks (ADRs may be tagged with focus_track: quality | security | eco | ai)"
---

# Phase 3: Design

Produce architectural rules (ADRs), technical documentation (architecture, data-flow, component specs, dependency interfaces), and the foundation for per-change implementation plans. The architect role owns this phase.

**Inputs:** Requirements (FR, NFR, US), current codebase, prior ADRs (overall guardrails).
**Outputs:** ADRs, architecture/design docs, traceability matrices. The `docs/design/implementation-plans/` directory is also initialized here so Phase 4 can persist per-change plans.
**Goals:** Create architectural rules (ADRs), maintain technical documentation, prepare the design baseline that constrains development.

## Authoritative grounding

| Concept | Source |
|---|---|
| Phase = Architecture Definition + Design Definition | ISO/IEC/IEEE 12207:2017 |
| Design output = Software Design Description | IEEE 1016 |
| ADR format = Title / Status / Context / Decision / Consequences | Michael Nygard, "Documenting Architecture Decisions" (2011) — https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions |
| ADR statuses = proposed, accepted, deprecated, superseded | Nygard 2011; adopted by ThoughtWorks, GDS, Red Hat |

## Prerequisites

- Phase 2 (Define) completed
- `docs/requirements/` fully populated with FR, NFR, US, traceability matrix

## Setup (before agents)

```bash
mkdir -p docs/design/{component-specs,dependency-interfaces,adrs,implementation-plans}
```

Write `docs/design/README.md` (see existing file for schema) and `docs/design/adrs/README.md` describing the ADR template.

If `docs/design/adrs/` already contains ADRs from a prior Design pass, **do not delete them** — they are guardrails for new design work. New ADRs are added with the next available `ADR-NNN` number; superseded ADRs are marked `status: superseded` and link to the replacement.

---

## Agent 1: Architecture Explorer

- **Type:** explore
- **Count:** 1 (of 2 parallel explore agents)
- **Parallelism:** runs simultaneously with Agent 2
- **Depends on:** setup complete
- **Input files:** all source files (discover from CLAUDE.md), `docs/requirements/functional/*.md`, **all existing ADRs in `docs/design/adrs/`** (if present)
- **Output:** architectural findings (passed to author agents)
- **Validation:** none (informational)

### Full Prompt

```
Perform a deep architectural analysis of the repository.

STEP 0 — DISCOVER THE PROJECT AND PRIOR GUARDRAILS

Read CLAUDE.md to identify all source files.

List `docs/design/adrs/` and read every ADR with status "accepted". These are
your guardrails — your architectural findings must be consistent with prior
accepted decisions, OR you must flag a conflict for an ADR to supersede.

Then read every source module.

STEP 1 — COMPONENT RELATIONSHIPS — Map the exact import/dependency graph
across all source files. Which file imports what from where? Show the
dependency direction.

STEP 2 — DATA FLOW — Pick the primary public API entry point and trace a
complete call through the system:
  - What is the entry point?
  - How does the call flow through internal modules?
  - What data structures are created and passed at each step?
  - When does I/O happen (filesystem, network, etc.)?

STEP 3 — DESIGN PATTERNS — Identify all design patterns used (e.g., Factory,
Strategy, Observer, Iterator, Builder, Template Method, Middleware, Plugin,
etc.). Name the pattern and cite the source location.

STEP 4 — EXTERNAL DEPENDENCY INTERFACES — For each runtime dependency in
package.json (or equivalent manifest), how exactly does the project interact
with it? What methods/classes/functions are used?

STEP 5 — CONCURRENCY MODEL — How does the project handle async operations,
parallelism, or concurrency? Describe the model (callbacks, promises, streams,
workers, event loop, etc.).

STEP 6 — CACHING / STATE — Identify any caching layers, memoization, shared
state, or stateful singletons. Describe what is cached and how invalidation
works.

STEP 7 — ADR CONSISTENCY CHECK — For each accepted ADR, verify the current
codebase is consistent with the decision. Flag any drift (the code now
violates an accepted ADR — that ADR may need to be deprecated/superseded).

Report with specific file and line references.
```

## Agent 2: Design Decisions Explorer

- **Type:** explore
- **Count:** 1 (of 2 parallel explore agents)
- **Parallelism:** runs simultaneously with Agent 1
- **Depends on:** setup complete
- **Input files:** README.md, changelog/release notes, source comments, package.json (or equivalent manifest), any benchmark or profiling scripts, **existing ADRs in `docs/design/adrs/`**
- **Output:** design rationale findings (passed to ADR Author)
- **Validation:** none (informational)

### Full Prompt

```
Analyze the repository for design decisions and trade-offs that should be
captured as ADRs.

STEP 0 — READ EXISTING ADRS

List `docs/design/adrs/` and read every existing ADR. Note which decisions
are already captured so you do not duplicate them. Each new finding must
either:
  - Match an existing ADR (no new ADR needed),
  - Be a NEW decision (propose a new ADR), or
  - Conflict with an existing ADR (propose superseding the existing one).

STEP 1 — Read and analyze:
1. README.md — performance claims, documented design choices, caveats
2. Changelog or release notes — breaking changes and their rationale (why
   were APIs removed or changed? why major rewrites?)
3. Source code comments — look for TODO, XXX, HACK, and explanatory comments
   that reveal trade-offs
4. Package manifest (package.json, Cargo.toml, etc.) — why specific build
   tools or dependency versions?
5. Any benchmark or profiling scripts — what performance aspects are measured?

STEP 2 — Report organized as:
- New decisions to propose as ADRs (what was chosen and why)
- Existing decisions that match a current ADR (cite ADR-NNN)
- Conflicts with existing ADRs (which ADR to supersede)
- Trade-offs acknowledged (correctness vs speed, simplicity vs flexibility)
- Known limitations / TODOs from source comments
- Performance priorities

For each finding, tag the evidence source:
- "documented" — explicitly stated in README, changelog, or doc comments
- "inferred" — reverse-engineered from code structure
- "partial" — some aspects documented, rationale elaborated by analysis
```

---

## Agent 3: Architecture Author

- **Type:** write
- **Count:** 1 (of 2 parallel author agents)
- **Parallelism:** runs simultaneously with Agent 4
- **Depends on:** Agents 1, 2
- **Input files:** findings from Agents 1-2, all source files, accepted ADRs
- **Output files:**
  - `docs/design/architecture-overview.md`
  - `docs/design/data-flow.md`
- **Validation:** ASCII diagrams render, all source references valid, content consistent with accepted ADRs

### Full Prompt

```
Write two architecture documents in docs/design/.

DOCUMENT 1: architecture-overview.md

YAML frontmatter:
---
id: "ARCH-001"
title: "Architecture Overview"
type: "architecture"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "architecture-author-agent"
references_adrs: [<list of ADR IDs that constrain this document>]
---

Include:
- Component Diagram (ASCII) — all source modules and external dependencies
  with import/dependency arrows
- Layer Architecture — group source modules into logical layers (e.g., API
  layer, core/orchestration layer, execution layer, utilities). Derive layers
  from the actual import graph.
- Caching / State Architecture — describe any caching layers, shared state,
  or memoization discovered
- Concurrency Model — describe the async/parallel execution model
- Design Patterns — list all patterns identified with source locations

DOCUMENT 2: data-flow.md

YAML frontmatter:
---
id: "ARCH-002"
title: "Data Flow"
type: "architecture"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "architecture-author-agent"
references_adrs: [<list of ADR IDs that constrain this document>]
---

Trace a complete call through the primary public API entry point, step by step:
1. Entry — how the user invokes the API
2. Initialization — what gets constructed or configured
3. Execution — how the core logic processes the request
4. Result assembly — how results are collected and returned
5. Completion / cleanup — how the operation finishes

Include an ASCII sequence diagram showing temporal flow.
READ source files for accurate line references.
```

## Agent 4: Component Spec Author

- **Type:** write
- **Count:** 1 (of 2 parallel author agents)
- **Parallelism:** runs simultaneously with Agent 3
- **Depends on:** Agents 1, 2
- **Input files:** findings from Agents 1-2, all source files, `docs/requirements/functional/*.md`
- **Output files:**
  - `docs/design/component-specs/CS-NNN-*.md` (one per source module)
  - `docs/design/dependency-interfaces/DI-NNN-*.md` (one per runtime dependency)
- **Validation:** YAML frontmatter parses, satisfies_fr references valid FR IDs, source_files exist

### Full Prompt

```
Write component spec and dependency interface documents.

COMPONENT SPECS — Create one CS document per source module (or logical
grouping of closely-related modules). Number them sequentially starting from
CS-001. Name each file CS-NNN-<descriptive-slug>.md.

Place in docs/design/component-specs/.

Format:

---
id: "CS-XXX"
title: "Title"
type: "component-spec"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "component-spec-author-agent"
source_files: [...]
satisfies_fr: [...]
satisfies_nfr: [...]
constrained_by_adrs: [<list of ADR IDs whose decisions affect this component>]
---

Include: Description, Public Interface, Internal Data Structures, Key
Algorithms, Component Interactions, Traceability section.

Each CS MUST list which FRs and NFRs it satisfies. Every FR from the Define
phase SHOULD appear in at least one CS.

DEPENDENCY INTERFACES — Create one DI document per runtime dependency listed
in the package manifest (package.json dependencies, Cargo.toml dependencies,
requirements.txt, etc.). Exclude dev-only dependencies. Number them
sequentially starting from DI-001.

Place in docs/design/dependency-interfaces/.

Format:

---
id: "DI-XXX"
title: "Title"
type: "dependency-interface"
status: "approved"
version: "1.0"
created: "<today's date>"
author: "component-spec-author-agent"
package: "<package-name>"
version_constraint: "<version from manifest>"
satisfies_fr: [...]
satisfies_nfr: [...]
constrained_by_adrs: [<list of ADR IDs whose decisions affect this dependency choice>]
---

Include: Purpose, Classes/Methods/Functions Used, Data Exchanged, Why This
Dependency (what would be required to replace it).

READ source files for accurate line references.
```

---

## Agent 5: ADR & Traceability Author

- **Type:** write
- **Count:** 1
- **Parallelism:** sequential (needs output from Agents 3 and 4)
- **Depends on:** Agents 3, 4
- **Input files:** existing ADRs in `docs/design/adrs/`, findings from Agent 2, `docs/design/component-specs/*.md`, `docs/design/dependency-interfaces/*.md`, `docs/requirements/functional/*.md`, `docs/requirements/nonfunctional/*.md`
- **Output files:**
  - `docs/design/adrs/ADR-NNN-<slug>.md` (one file per architectural decision, Nygard format)
  - `docs/design/adrs/README.md` (index of ADRs)
  - `docs/design/design-traceability.md` (CS/DI/ADR coverage matrices)
- **Validation:** every FR appears in at least one CS satisfies_fr, every NFR appears in at least one CS/DI/ADR, every ADR has a valid status

### Full Prompt

```
Write ADR documents (one per decision) and the design traceability matrix.

OUTPUT 1 — ADRs in docs/design/adrs/

For EACH design decision identified by Agent 2 (Design Decisions Explorer)
that does not already have an ADR, create one file:

  docs/design/adrs/ADR-NNN-<descriptive-slug>.md

Use the next available ADR number. List existing ADRs first to avoid
collisions.

ADR template (Michael Nygard 2011 format — five sections):

---
id: "ADR-NNN"
title: "<short noun phrase>"
type: "adr"
status: "accepted"               # proposed | accepted | deprecated | superseded
version: "1.0"
created: "<today's date>"
author: "adr-author-agent"
supersedes: []                    # ADR IDs this one replaces
superseded_by: ""                 # ADR ID that replaced this one (if any)
satisfies_nfr: [<list>]
focus_track: "quality|security|eco|ai"   # OPTIONAL — SDLC focus track
                                         # Set when the decision is driven
                                         # primarily by one focus track (e.g.,
                                         # a security-driven ADR). Omit if
                                         # the decision spans multiple tracks
                                         # or is purely structural.
evidence: "documented|inferred|partial"
---

# ADR-NNN: <Title>

## Status
<one of: Proposed, Accepted, Deprecated, Superseded by ADR-XXX>

## Context
<the forces at play — technical, business, social — that motivate this
decision. Cite the source: README, changelog, code structure, etc.>

## Decision
<the change being proposed or made — stated as: "We will ...">

## Consequences
<what becomes easier and what becomes harder. List both positive and
negative consequences. Reference NFRs that this decision satisfies or
threatens.>

NOTES:
- Each ADR is ONE decision. Do not bundle multiple decisions into a single
  ADR — split them.
- For decisions Agent 2 identified as conflicting with an existing ADR:
  create a new ADR with `supersedes: [ADR-OLD]` and update the old ADR's
  frontmatter to `status: superseded` and `superseded_by: "ADR-NEW"`.
- For decisions that exist in code but were not previously captured: create
  ADRs with `status: accepted` and evidence tag.

OUTPUT 2 — docs/design/adrs/README.md (ADR index)

| ADR | Title | Status | Supersedes | Satisfies NFR |
|-----|-------|--------|------------|---------------|
| ADR-001 | <title> | accepted | — | NFR-001 |
| ADR-002 | <title> | superseded by ADR-005 | — | NFR-002 |

Include a one-paragraph summary of how to write a new ADR (template + Nygard
citation).

OUTPUT 3 — docs/design/design-traceability.md

Create matrices showing:
1. CS -> FR coverage (every FR must appear in at least one CS satisfies_fr)
2. CS/DI -> NFR coverage (every NFR must appear in at least one document)
3. DI -> FR mapping
4. ADR -> NFR mapping (replaces the old DD -> NFR mapping)
5. Component -> ADR constraints (which CS/DI is constrained by which ADRs)

Verify: Are ALL FRs from the Define phase covered? Are ALL NFRs covered?
Are all ADRs either accepted or properly superseded? Report any gaps.
```

## Agent 6: Design Reviewer

- **Type:** validate
- **Count:** 1
- **Parallelism:** sequential (last agent)
- **Depends on:** Agents 3, 4, 5
- **Input files:** all files in `docs/design/`, all files in `docs/requirements/`, all source files
- **Output:** PASS/FAIL report
- **On failure:** fix issues, then re-run this agent

### Full Prompt

```
Validate ALL design documents in docs/design/.

Checks:
1. DOCUMENT INVENTORY — All expected files present:
   - architecture-overview.md
   - data-flow.md
   - all CS docs in component-specs/
   - all DI docs in dependency-interfaces/
   - ADR files in adrs/ (at least one per design decision identified)
   - adrs/README.md (ADR index)
   - design-traceability.md
2. FR COVERAGE — Every FR from docs/requirements/functional/ is covered by
   at least one CS document's satisfies_fr field
3. NFR COVERAGE — Every NFR from docs/requirements/nonfunctional/ is covered
   by at least one CS, DI, or ADR (satisfies_nfr field)
4. SOURCE FILE VALIDATION — All source_files in YAML frontmatter exist in
   the repo
5. YAML FRONTMATTER — CS docs have id, title, type, status, source_files,
   satisfies_fr, satisfies_nfr, constrained_by_adrs. DI docs also have
   package field. ADRs have id, status, supersedes/superseded_by.
6. ADR INTEGRITY:
   - Every ADR has Status, Context, Decision, Consequences sections
   - Every ADR has a unique ADR-NNN ID
   - Every superseded ADR has a valid `superseded_by` reference
   - The ADR index in adrs/README.md matches the actual file list
7. CROSS-REFERENCE CONSISTENCY — satisfies_fr/satisfies_nfr in CS/DI/ADR
   docs match the design-traceability.md matrices
8. ARCHITECTURE COMPLETENESS — architecture-overview.md covers all source
   modules and all runtime dependencies; constrained_by_adrs fields
   correctly reference accepted ADRs

Report as PASS/FAIL/WARNING. Be concise.
```

---

## Completion

Update `docs/requirements/sdlc-metadata.yml`:
```yaml
design:
  status: "completed"
  completed: "<today's date>"
  adrs_count: <number of ADRs in docs/design/adrs/ excluding README>
```

## Coordination Summary

```
Setup: mkdir adrs/, implementation-plans/
                            │
                            ▼
Agents 1, 2 (explore) ─────┐
    run in parallel          │
    read prior ADRs as       │
    guardrails               │
                             ▼
Agents 3, 4 (author) ──────┐
    run in parallel          │
    architecture + CS/DI     │
                             ▼
Agent 5 (ADRs + traceability)
    sequential               │
    one ADR file per decision│
                             ▼
Agent 6 (reviewer) ─────────┐
    sequential               │
                             ▼
    Fix issues if needed
                             │
                             ▼
    Update sdlc-metadata.yml
```

## What about implementation plans?

`docs/design/implementation-plans/` is created here but populated **per change request** by the **Architect Planner agent in Phase 4** (see `phase-4-develop.md`). The plan is the contract between architect (Phase 3 role, repeatable) and developer (Phase 4 role) — per ISO/IEC/IEEE 12207, Design Definition outputs feed Implementation; per Microsoft SDL, "developers write code according to the plan from the previous phases".
