---
id: "PHASE-VERIFY"
phase: "verify"
phase_number: 5
trigger: "sdlc-metadata.yml shows develop.status=completed AND verify.status=pending"
estimated_agents: 5
evidence: "template — project-agnostic playbook"
standards:
  - "IEEE 1012-2016 — System, Software, and Hardware Verification and Validation"
  - "ISO/IEC/IEEE 12207:2017 — Verification + Validation processes"
  - "Microsoft SDL — Verification phase (mandates separation of duties: reviewer ≠ author)"
  - "ISO/IEC 25010 — Software product quality model (basis for NFR validation in this phase)"
  - "Quality Lifecycle focus track — anchored to ISO/IEC 25010"
---

# Phase 5: Verify

Independently confirm that the developed code is correct (**verification** — "are we building it right?") AND that it meets user needs (**validation** — "are we building the right thing?"). Per IEEE 1012, these are two distinct activities; this playbook splits them into separate agent groups.

**Inputs:** Code, unit tests, requirements, design specs, persisted implementation plans.
**Outputs:** Independent code review report, V&V report, defect list, security/static analysis results, UAT result.
**Goals:** Catch defects independent of the development team; gate the Release phase.

## Authoritative grounding

| Concept | Source |
|---|---|
| Verification ≠ Validation | IEEE 1012-2016; ISO/IEC/IEEE 12207:2017 |
| Verification = "building it right" (against specs) | IEEE 1012 |
| Validation = "building the right thing" (against user needs) | IEEE 1012 |
| Reviewer must be independent of author | Microsoft SDL Verification |
| Static analysis, fuzz testing, dependency scanning are Verification activities | Microsoft SDL |
| UAT, end-to-end, penetration tests are Validation activities | ISO 12207, IEEE 1012 |

> **Important boundary with Phase 4 (Develop):** Unit tests are authored by the developer in Phase 4. Phase 5 owns *integration* tests, *system* tests, *static/dynamic analysis*, *independent code review*, and *user acceptance testing*. The Phase 5 agents do not modify source code or unit tests — defects are routed back to Phase 4.

## Prerequisites

- Phase 4 (Develop) completed: code changes implemented, code review APPROVED, plan persisted
- `docs/requirements/sdlc-metadata.yml` shows `develop.status: completed` and `verify.status: pending`

---

## Group A — Verification ("are we building it right?")

### Agent 1: Coverage Analyst

- **Type:** explore
- **Count:** 1
- **Parallelism:** standalone (must complete before Verify Reviewer)
- **Depends on:** Develop phase completed
- **Input files:** `docs/requirements/traceability-matrix.md`, `docs/design/design-traceability.md`, `docs/requirements/functional/*.md`, `docs/requirements/nonfunctional/*.md`, `docs/design/implementation-plans/*.md`, project test and source files
- **Output:** coverage gap report
- **Validation:** report identifies all gaps; zero gaps is ideal

### Full Prompt

```
You are the Coverage Analyst agent (Verification group). Verify every
requirement has corresponding test coverage and identify gaps.

STEP 0 — DISCOVER THE PROJECT

Read CLAUDE.md for test command, file location, conventions.

STEP 1 — BUILD THE REQUIREMENT-TO-TEST MAP

Read docs/requirements/traceability-matrix.md.

List directories to discover actual inventory:
  - docs/requirements/functional/
  - docs/requirements/nonfunctional/
  - docs/requirements/user-stories/
  - test directory from CLAUDE.md
  - docs/design/implementation-plans/   (recent change history)

Do NOT assume specific counts. Discover them from the filesystem.

STEP 2 — RUN TESTS WITH COVERAGE

Run the test command from CLAUDE.md.

Record total test files, pass/fail count, coverage percentage if reported.

STEP 3 — VERIFY AC-TO-TEST TRACEABILITY

For each FR found:
  a. Read the FR document — get all acceptance criteria
  b. Read the test files in test_files frontmatter
  c. Search for test cases exercising each AC
  d. Mark each AC as COVERED or UNCOVERED

STEP 4 — CHECK FOR ORPHAN REQUIREMENTS

An "orphan FR" has no test coverage. List any FR with empty test_files,
or test_files that contain no relevant assertions, or NFRs with
verification_method: "test" with no corresponding test.

STEP 5 — CHECK FOR ORPHAN TESTS

Test files not in the traceability matrix.

STEP 6 — CHECK PLANS-TO-TESTS COVERAGE

For each implementation plan in docs/design/implementation-plans/, verify
the "New Test Scenarios" section was actually delivered. Plans that propose
tests that don't exist are a critical gap.

STEP 7 — PRODUCE THE COVERAGE GAP REPORT

---
COVERAGE GAP REPORT
---

## Test Suite Results
- Test command: <command>
- Exit code: 0 / non-zero
- Test files executed: XX / YY
- Passed: XX
- Failed: XX (list)

## FR Coverage Matrix
| FR ID  | Title | AC Count | ACs Covered | ACs Uncovered | Test Files | Status |

## NFR Coverage
| NFR ID | Title | Verification Method | Artifact | Status |

## Plan Coverage
| Plan ID | New Test Scenarios | Delivered? |

## Orphan FRs
- <FR-ID>: <title> — <reason>

## Orphan Tests
- <test file> — <description>

## Uncovered Acceptance Criteria
| FR ID | AC ID | AC Description | Reason Uncovered |

## Recommendations
- <actionable recommendations>
```

### Agent 2: Independent Code Reviewer

> **Per Microsoft SDL: reviewer ≠ author.** This agent does NOT have access to the Code Author or Test Author from Phase 4 — it reviews fresh against the code, plan, ADRs, and design docs. This is the agentic-framework equivalent of "another developer reviews your PR".

- **Type:** validate
- **Count:** 1
- **Parallelism:** runs simultaneously with Agents 3 and 4 (Verification group)
- **Depends on:** Develop phase completed
- **Input files:** modified source/test files, recent implementation plans, ADRs, CS/DI docs, source/test files
- **Output:** independent review report
- **Validation:** PASS = no blocker findings; FAIL = blockers found

### Full Prompt

```
You are the Independent Code Reviewer (Verification group). Per Microsoft
SDL, you must NOT be the same agent that authored or first-reviewed the
code. Review with fresh eyes.

STEP 0 — DISCOVER PROJECT CONVENTIONS

Read CLAUDE.md.

STEP 1 — IDENTIFY RECENT CHANGES

Determine what was changed in Phase 4. Sources:
  - List docs/design/implementation-plans/ — read the most recent plan(s)
  - Read git log if available (`git log --oneline -20`)
  - Read sdlc-metadata.yml's `develop.plans` list

STEP 2 — INDEPENDENT REVIEW

For each changed file:
  - Read the file fresh (do not rely on prior summaries)
  - Read the plan that justified the change
  - Read the ADRs in `constrained_by_adrs`

Check:

  a. CORRECTNESS — Does the implementation match the plan's intent?
     Identify any logic bugs, off-by-one errors, edge cases.

  b. ADR ADHERENCE — Are accepted ADRs respected? If the plan declared
     `proposes_new_adrs`, verify the new ADR was authored properly.

  c. CS CONFORMANCE — Do the changes match the Public Interface in CS docs?

  d. SECURITY — Look for: injection vectors, resource limit bypasses,
     hardcoded secrets, weak input validation.

  e. PERFORMANCE — Look for: sync I/O in async paths, unbounded loops,
     N+1 queries, broken caches.

  f. CONCURRENCY — Look for: race conditions, missing locks, broken
     promise chains, unhandled errors.

  g. TEST INDEPENDENCE — Are unit tests independent of execution order?
     Do they avoid shared mutable state?

STEP 3 — REPORT

## Independent Review Report

### Files reviewed
- <file path> (plan: PLAN-NNN)

### Findings

#### BLOCKER
- [B-1] <file>:<line> — <description>

#### WARNING
- [W-1] ...

#### INFO
- [I-1] ...

### Verdict
PASS — no blockers
  OR
FAIL — <count> blockers, route to Phase 4
```

### Agent 3: Static & Dynamic Analyzer

- **Type:** validate
- **Count:** 1
- **Parallelism:** runs simultaneously with Agents 2 and 4
- **Depends on:** Develop phase completed
- **Input files:** project source files, package manifest, lockfile
- **Output:** static/dynamic analysis report

### Full Prompt

```
You are the Static & Dynamic Analyzer (Verification group). Run analysis
tools that exercise code without depending on the unit-test suite.

STEP 0 — DISCOVER ANALYSIS TOOLS

Read CLAUDE.md and package.json. Identify:
  - Linter (e.g., oxlint, eslint, ruff, clippy)
  - Type checker (e.g., tsc, mypy, pyright)
  - Formatter
  - Security scanner (e.g., npm audit, pip-audit, cargo audit)
  - Any fuzz / property-based testing config

STEP 1 — STATIC ANALYSIS

Run each available tool. Record:
  - Lint errors and warnings (with severity)
  - Type errors
  - Format violations
  - Dead code, unused imports
  - Security advisories

STEP 2 — DEPENDENCY SCANNING

Run: npm audit (or pip-audit, cargo audit, equivalent).
For each advisory: severity, affected package, available fix.
Cross-reference with security NFR document if present.

STEP 3 — INTEGRATION / SMOKE TESTS

If the project has integration tests (separate from unit tests authored in
Phase 4), run them. Otherwise, exercise the public API once with a
representative call to confirm the build is not broken.

STEP 4 — REPORT

## Static & Dynamic Analysis Report

### Lint
- Errors: XX
- Warnings: XX
- Details: <list issues, or "clean">

### Type Check
- Errors: XX
- Details: <list>

### Format
- Unformatted files: XX

### Security Advisories
| Severity | Package | Vuln | Fix Available |

### Integration / Smoke
- Result: PASS / FAIL / N/A
- Details: <run output summary>

### Verdict
PASS — analysis clean
  OR
FAIL — <list blockers>
```

### Agent 4: Regression Tester

- **Type:** validate
- **Count:** 1
- **Parallelism:** runs simultaneously with Agents 2 and 3
- **Depends on:** Develop phase completed
- **Input files:** project source files, test files, package manifest, test configuration
- **Output:** regression test report

### Full Prompt

```
You are the Regression Tester (Verification group). Verify the entire test
suite passes reliably with no flaky tests.

STEP 0 — DISCOVER

Read CLAUDE.md for build, test, lint commands.

STEP 1 — FIRST FULL RUN

Run build (if separate) then test command.
Record: build result, test files executed, individual assertion counts,
pass/fail per file, lint warnings (if part of pipeline), formatter changes.

STEP 2 — SECOND FULL RUN (FLAKY DETECTION)

Run test suite again.
Compare to first run:
  - Test passed in run 1, failed in run 2 (or vice versa) → FLAKY
  - Different assertion counts between runs → SUSPECT
  - Timing > 50% difference for same file → SUSPECT

STEP 3 — REPORT

## Regression Test Report

### Run 1
- Test files: XX / YY
- Passed: XX, Failed: XX
- Duration: XX seconds

### Run 2
- (same fields)

### Flaky Tests
| Test | Run 1 | Run 2 | Verdict |

### Verdict
PASS / FAIL
```

---

## Group B — Validation ("are we building the right thing?")

### Agent 5: Validation Reviewer (UAT + Gate)

> **Per IEEE 1012, Validation confirms the product meets user needs.** For library/CLI projects this is User Acceptance Testing against user stories; for web/UI projects it includes end-to-end browser testing. This agent also serves as the **release gate** — consolidating the Verification group's reports + the Validation result into a single decision.

- **Type:** validate
- **Count:** 1
- **Parallelism:** sequential (after Agents 1, 2, 3, 4)
- **Depends on:** Agents 1, 2, 3, 4
- **Input files:** all reports from Agents 1-4, `docs/requirements/user-stories/*.md`, `docs/requirements/nonfunctional/*.md`, `docs/design/implementation-plans/*.md`
- **Output:** consolidated V&V report; gates the Release phase
- **On failure:** blockers routed back to Develop phase (Phase 4)

### Full Prompt

```
You are the Validation Reviewer (Validation group + release gate).

INPUTS:
- Coverage Gap Report (Agent 1)
- Independent Review Report (Agent 2)
- Static & Dynamic Analysis Report (Agent 3)
- Regression Test Report (Agent 4)

STEP 0 — DISCOVER COUNTS

Use counts from the Verification reports. Do NOT hardcode.

STEP 1 — VALIDATION (USER STORY CONFORMANCE)

List all files in docs/requirements/user-stories/. For each US:
  - Read the full user story
  - Read its acceptance criteria
  - Check the test files referenced in implements_fr — do they validate
    the user-story behavior, not just the FR mechanics?
  - For UI/web projects: if browser tests exist, run them; otherwise note
    "manual UAT required: <steps>"

If any user story has no validation evidence, flag as VALIDATION GAP.

STEP 2 — NFR VALIDATION

List all NFRs. For each:
  - Read the NFR document and verification_method
  - Find the artifact(s) cited by Verification group reports
  - Mark PASS / FAIL

STEP 3 — CONSOLIDATE GATE CONDITIONS

The project is READY FOR RELEASE if ALL of the following are true:

  a. Coverage Analyst: every FR has 100% AC coverage (no gaps)
  b. Independent Reviewer: PASS (no blockers)
  c. Static & Dynamic Analyzer: PASS (lint clean, no critical security
     advisories)
  d. Regression Tester: all tests pass on both runs, no flaky tests
  e. Every user story has validation evidence (Step 1)
  f. Every NFR is PASS (Step 2)
  g. No accepted ADR is violated by the current code
  h. Every implementation plan in docs/design/implementation-plans/ has
     its proposed FR/US created (Requirements Sync ran)

If ANY condition fails: REWORK REQUIRED in Phase 4.

STEP 4 — PRODUCE THE V&V REPORT

---
VERIFICATION & VALIDATION REPORT
---

## Executive Summary
- Date: <today>
- Project: <name from CLAUDE.md>
- Phase: Verify (Phase 5)
- Verdict: READY FOR RELEASE / REWORK REQUIRED

## Verification Results (Group A)
- Coverage Analyst: <verdict>
- Independent Code Reviewer: <verdict, blocker count>
- Static & Dynamic Analyzer: <verdict>
- Regression Tester: <verdict>

## Validation Results (Group B)
| US ID | Title | Validation Evidence | Verdict |

| NFR ID | Title | Verification Method | Verdict |

## Gate Conditions
| # | Condition | Status | Details |
| a | All FRs 100% AC coverage | PASS | |
| b | Independent review PASS | PASS | |
| c | Static & dynamic clean | PASS | |
| d | Regression stable, no flakes | PASS | |
| e | All US validated | PASS | |
| f | All NFRs PASS | PASS | |
| g | No ADR violations | PASS | |
| h | All plans have synced reqs | PASS | |

## Verdict
READY FOR RELEASE — all gate conditions met.
  OR
REWORK REQUIRED — <count> conditions failed:
  - [letter]: <description>
  - Route to: Phase 4 (specify agent: Code Author / Test Author /
    Architect Planner / Requirements Sync)

## Rework Items (if REWORK REQUIRED)
| # | Category | Description | Responsible Phase | Priority |
```

---

## Completion

When the Validation Reviewer reports READY FOR RELEASE:

Update `docs/requirements/sdlc-metadata.yml`:
```yaml
verify:
  status: "completed"
  completed: "<today's date>"
  verification:
    coverage_analyst: "<gap count>"
    independent_reviewer: "PASS"
    static_dynamic_analyzer: "PASS"
    regression_tester: "PASS"
  validation:
    user_stories_validated: "XX/YY"
    nfrs_passed: "XX/YY"
  verdict: "READY FOR RELEASE"
```

When REWORK REQUIRED:

Do NOT update `verify.status`. Instead, route rework items back to Phase 4. The Develop phase re-executes with the rework items as the change request, then Verify runs again.

## Coordination Summary

```
GROUP A — VERIFICATION (in parallel)
                                ┐
Agent 1 (Coverage Analyst) ─────┤
Agent 2 (Independent Reviewer) ─┤  parallel
Agent 3 (Static & Dynamic) ─────┤
Agent 4 (Regression Tester) ────┘
                                ▼
GROUP B — VALIDATION + GATE
                                │
Agent 5 (Validation Reviewer) ──┐
    sequential                   │
                                 ▼
    READY FOR RELEASE ────► Update sdlc-metadata.yml
                                 │
    REWORK REQUIRED ──────► Route back to Phase 4
                                 (do NOT update status)
```
