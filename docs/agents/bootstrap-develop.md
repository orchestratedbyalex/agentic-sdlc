---
id: "BOOTSTRAP-DEVELOP"
type: "bootstrap"
phase: "develop"
phase_number: 4
version: "3.0"
created: "2026-05-01"
---

# Bootstrap: Develop Phase

Copy the prompt below and give it to any LLM coding agent (Claude Code, Codex, Cursor, Aider, etc.). Replace the `[CHANGE REQUEST]` section with your actual feature/bug/enhancement.

The Develop phase has TWO roles working iteratively (per ISO/IEC/IEEE 12207 and Microsoft SDL):
- **Architect** — produces the implementation plan, reading ADRs as guardrails (Agent 1, 4, 5)
- **Developer** — implements code + unit tests, can flag ambiguities back to architect (Agents 2, 3)

---

## Ready-to-Paste Prompt

````
You are an autonomous coding agent executing the Develop phase of an
agentic SDLC on this repository.

## Change Request

[CHANGE REQUEST — Replace this section with your feature, bug fix, or
enhancement. Be specific about what behavior you want. Example:

"Add a timeout option that wraps an existing feature with a convenience
parameter, so users don't need to wire up the underlying mechanism
themselves."]

## Instructions

You will execute 6 agents (with an optional clarifier loop between Agents
2/3 and Agent 4). For each agent, read its full prompt from the playbook
file and follow it.

### Step 1: Read context files

Read these files first to understand the project:

- CLAUDE.md (build/test/lint commands and project conventions)
- docs/requirements/sdlc-metadata.yml (SDLC state)
- docs/agents/phase-4-develop.md (your playbook — contains full prompts)

Also read all ADRs in docs/design/adrs/ that have status "accepted" — these
are guardrails your work must respect.

### Step 2: Agent 1 — Architect Planner

Read the full prompt for Agent 1 in docs/agents/phase-4-develop.md.

Your job: produce an implementation plan as a PERSISTED FILE.

  - Read all ADRs in docs/design/adrs/ as guardrails
  - Read docs/requirements/traceability-matrix.md to find relevant FRs
  - Read docs/design/design-traceability.md to find relevant CSs
  - Read the source files identified by the requirements / design docs
  - Read the existing test files

Then write the plan to:
  docs/design/implementation-plans/PLAN-NNN-<slug>.md

Use the next available PLAN number. Follow the schema in the playbook
(YAML frontmatter with id, addresses_fr, constrained_by_adrs, etc.).

Output: PLAN_PATH: docs/design/implementation-plans/PLAN-NNN-<slug>.md

### Step 3: Agent 2 — Code Author (Developer role)

Read the full prompt for Agent 2 in docs/agents/phase-4-develop.md.

Read the plan file from PLAN_PATH. Read the ADRs in the plan's
constrained_by_adrs field.

CRITICAL: Before writing code, scan the plan for ambiguities. If anything
is unclear (functions you cannot find, behavior described in conflicting
terms, missing details), STOP and emit an AMBIGUITIES block. Do NOT guess.

If clear, implement the source changes following the plan. Run the build
command from CLAUDE.md.

### Step 4: Agent 3 — Test Author (Developer role)

Read the full prompt for Agent 3 in docs/agents/phase-4-develop.md.

Same ambiguity check as Agent 2. If clear, write unit tests for every AC
in the plan's "New Test Scenarios" section. Run the test command.

### Step 5: Agent 4 — Architect Clarifier (only if AMBIGUITIES emitted)

If Agent 2 or Agent 3 emitted an AMBIGUITIES block, run Agent 4:
  - Re-read requirements, ADRs, and source code
  - Update the plan file (bump version, add a "Clarifications" section)
  - Re-run Agents 2 and/or 3 with the updated plan

### Step 6: Agent 5 — Code Reviewer (Architect verification role)

Read the full prompt for Agent 5 in docs/agents/phase-4-develop.md.

Review all changes against the plan and ADRs. Run the FULL test suite.

If CHANGES REQUESTED, route blockers back to Agent 2 or Agent 3 and re-run
Agent 5.

### Step 7: Agent 6 — Requirements Sync (CRITICAL)

Read the full prompt for Agent 6 in docs/agents/phase-4-develop.md.

For every behavior added in this change that isn't in an existing FR/US:
  1. Create a new FR in docs/requirements/functional/
  2. Create a new US in docs/requirements/user-stories/
  3. Update docs/requirements/traceability-matrix.md
  4. Update docs/design/design-traceability.md
  5. Increment requirement_counts in sdlc-metadata.yml

If the plan declared `proposes_new_adrs`, verify the new ADR was authored
in docs/design/adrs/ and any superseded ADRs were updated.

Skipping this step creates orphan features invisible to future agents.

### Step 8: Finalize

After all agents pass:
1. Update docs/requirements/sdlc-metadata.yml:
   - develop.status: "completed"
   - develop.plans: append the PLAN-NNN entry
2. Summarize:
   - PLAN-NNN file path
   - Files changed
   - Tests added
   - New requirements created
   - Ambiguity rounds (if any)
   - Reviewer verdict

## Key file locations

| What | Where |
|------|-------|
| Build/test/lint commands | CLAUDE.md |
| Requirements index | docs/requirements/traceability-matrix.md |
| Design index | docs/design/design-traceability.md |
| ADRs (architectural guardrails) | docs/design/adrs/*.md |
| Implementation plans (persisted) | docs/design/implementation-plans/PLAN-*.md |
| Agent playbook | docs/agents/phase-4-develop.md |
| Source code | (see CLAUDE.md for project layout) |
| Tests | (see CLAUDE.md for project layout) |
| Functional requirements | docs/requirements/functional/FR-*.md |
| User stories | docs/requirements/user-stories/US-*.md |
| Component specs | docs/design/component-specs/CS-*.md |
| Dependency interfaces | docs/design/dependency-interfaces/DI-*.md |

## Code style rules

Follow the existing code style in the project. Read CLAUDE.md and
existing source files for conventions including:
- Language and type strictness settings
- Quote style, semicolons, indentation
- Print width / line length
- Linter and formatter configuration

Read CLAUDE.md for the build, test, lint, and format commands.
````

---

## Example Usage

Here is what the `[CHANGE REQUEST]` section might look like for a concrete feature:

```
Add a timeout option that wraps an existing feature with a convenience
parameter, so users don't need to wire up the underlying mechanism
themselves. If both the new convenience parameter and the original
option are provided, the original takes precedence.
```

The Architect Planner agent (Agent 1) would then:
1. Read all accepted ADRs in `docs/design/adrs/` — checking for any that constrain how options are added
2. Read the traceability matrix to find FRs for the existing feature
3. Read the relevant component specs for where the option interface is defined
4. Read existing source/test files
5. Write `docs/design/implementation-plans/PLAN-NNN-<slug>.md` with: which file to modify, which AC to satisfy, which existing ADRs constrain the change, whether a new ADR is needed
6. Output the PLAN_PATH

The Code Author and Test Author then implement against that persisted plan.
