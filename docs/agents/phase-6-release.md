---
id: "PHASE-RELEASE"
phase: "release"
phase_number: 6
trigger: "sdlc-metadata.yml shows verify.status=completed AND release.status=pending"
estimated_agents: 3
evidence: "template — project-agnostic playbook"
---

# Phase 6: Release

Prepare and publish a new version of the project. This phase determines the correct semver version bump, updates all release artifacts, and validates the package before human-approved publish.

## Prerequisites

- Phase 5 (Verify) completed
- All tests passing (test command from CLAUDE.md)
- Build artifacts current (build command from CLAUDE.md)
- `docs/requirements/sdlc-metadata.yml` shows `verify.status=completed`

## Setup (before agents)

```bash
# Ensure build artifacts are current before analysis
# Run the build command from CLAUDE.md
```

---

## Agent 1: Release Planner

- **Type:** explore
- **Count:** 1
- **Parallelism:** standalone (runs first)
- **Depends on:** setup complete
- **Input files:** package.json (or equivalent manifest), changelog file, `docs/requirements/sdlc-metadata.yml`, `docs/requirements/functional/*.md`, `docs/requirements/nonfunctional/*.md`, git log since last tag
- **Output:** release plan (passed to Agent 2 via conversation context)
- **Validation:** none (informational)

### Full Prompt

```
You are the Release Planner agent. Determine the appropriate semver version
bump and produce a release plan.

STEP 0 — DISCOVER THE PROJECT

Read CLAUDE.md to learn:
  - Project name and purpose
  - Build command
  - Package registry (npm, PyPI, crates.io, etc.)
  - Any release-specific instructions

STEP 1 — Read the current state:

  Read package.json (or equivalent manifest) and extract the current version.

  Look for a changelog file at the project root (changelog.md, CHANGELOG.md,
  CHANGES.md, HISTORY.md). Read it and identify the structure, tone, and
  formatting conventions used for previous entries (heading style, bullet
  format, attribution, date format).

  Read docs/requirements/sdlc-metadata.yml to confirm verify.status is
  "completed" and to review what was built in the develop phase.

STEP 2 — Analyze changes since the last release:

  Run: git log $(git describe --tags --abbrev=0)..HEAD --oneline
  This shows all commits since the last tagged release.

  Run: git diff $(git describe --tags --abbrev=0)..HEAD --stat
  This shows which files changed and by how much.

  Run: git diff $(git describe --tags --abbrev=0)..HEAD -- <source directory>
  (Determine the source directory from CLAUDE.md or project structure.)
  This shows the actual source code changes.

  If no previous tags exist, analyze all commits and treat this as the
  initial release.

  Classify every change into one of:
  - BREAKING: removed or renamed public API, changed default behavior,
    dropped runtime version support, changed return types
  - FEATURE: new exported function, new option, new capability
  - FIX: bug fix, corrected behavior, improved error message
  - INTERNAL: refactor, test improvement, docs, build tooling

STEP 3 — Determine the semver bump:

  Apply semver rules strictly:
  - If ANY change is BREAKING -> major bump
  - Else if ANY change is FEATURE -> minor bump
  - Else -> patch bump

  Cross-reference with:
  - FR documents in docs/requirements/functional/ to confirm new features
    match documented requirements
  - NFR documents in docs/requirements/nonfunctional/ to check if
    compatibility constraints affect the bump decision
    (e.g., dropping a runtime version is a breaking change)

STEP 4 — Draft the changelog entry:

  Match the existing changelog style exactly. If no changelog exists, use
  a standard format:
  - Heading with version number and date
  - Grouped by change type (breaking, features, fixes)
  - Each item with a concise description

STEP 5 — Identify migration notes:

  If the bump is major, draft migration notes covering:
  - What broke and why
  - Before/after code examples for each breaking change
  - Minimum actions a consumer must take to upgrade

  If minor or patch, state "No migration required."

STEP 6 — Produce the release plan:

  Output a structured report:
  - Current version: X.Y.Z
  - New version: X.Y.Z
  - Bump type: major | minor | patch
  - Changelog entry (complete, ready to insert)
  - Migration notes (if any)
  - Risk assessment: LOW (patch, no API changes), MEDIUM (minor, new
    features), or HIGH (major, breaking changes)
```

## Agent 2: Release Author

- **Type:** write
- **Count:** 1
- **Parallelism:** standalone (sequential)
- **Depends on:** Agent 1
- **Input files:** release plan from Agent 1, changelog file, package.json (or equivalent manifest), build output directory
- **Output files:**
  - Updated changelog (new entry prepended)
  - Updated manifest (version field)
  - Fresh build artifacts
  - Git commit and tag
- **Validation:** build command from CLAUDE.md succeeds, build output contains expected files

### Full Prompt

```
You are the Release Author agent. Using the release plan from the Release
Planner, execute all release preparation steps.

STEP 0 — DISCOVER THE PROJECT

Read CLAUDE.md to learn:
  - Build command
  - Package manager and registry
  - Build output directory
  - Any release-specific instructions

STEP 1 — Update the changelog:

  Read the changelog file to understand the existing format.

  Insert the new changelog entry from the release plan at the TOP of the
  file, immediately after any header/preamble. Do not modify existing
  entries.

  Verify the entry matches the style of previous entries (heading level,
  date format, bullet style, grouping).

  If no changelog file exists, create one following a standard format.

STEP 2 — Update the version:

  Use the appropriate version bump command for the project's package manager:
  - npm: npm version <major|minor|patch> --no-git-tag-version
  - Other: manually edit the version field in the manifest file

  Verify: Read the manifest file and confirm the version field matches the
  planned new version.

STEP 3 — Build fresh artifacts:

  Run the build command from CLAUDE.md.

  Verify the build completed without errors.

STEP 4 — Verify build output:

  List the contents of the build output directory (identified from CLAUDE.md
  or the project manifest).

  Confirm that the expected artifact types are present:
  - Compiled/bundled source files
  - Type declarations (if applicable to the language)
  - Source maps (if applicable)
  - Any package marker files required by the module system

STEP 5 — Verify package contents:

  If the project publishes to a package registry, use the dry-run pack command
  to review what would be published:
  - npm: npm pack --dry-run 2>&1
  - Other: equivalent command for the registry

  Confirm:
  - No test files included
  - No docs/ directory included
  - No .env, .git, or other sensitive files
  - Build artifacts are included
  - Manifest and license files are included

STEP 6 — Create git commit and tag:

  Stage the changed files:
  git add <changelog file> <manifest file> <lock file if present> <build output directory>

  Create the release commit:
  git commit -m "v<NEW_VERSION>"

  Create an annotated tag:
  git tag -a v<NEW_VERSION> -m "v<NEW_VERSION>"

  Do NOT push. Do NOT publish to the registry. These require human approval.

Report what was done: files changed, version bumped, commit SHA, tag name.
```

## Agent 3: Release Reviewer

- **Type:** validate
- **Count:** 1
- **Parallelism:** standalone (sequential, last agent)
- **Depends on:** Agent 2
- **Input files:** changelog file, package.json (or equivalent manifest), build output, `docs/requirements/sdlc-metadata.yml`, git log, git tag
- **Output:** PASS/FAIL report
- **On failure:** fix issues, then re-run this agent

### Full Prompt

```
You are the Release Reviewer agent. Validate that the release was prepared
correctly before human-approved publish.

STEP 0 — DISCOVER THE PROJECT

Read CLAUDE.md to learn:
  - Build output directory
  - Package manager and registry
  - Expected build artifacts
  - Module system (CJS, ESM, dual, etc.)

CHECK 1 — VERSION CONSISTENCY:

  Read the manifest file (package.json or equivalent) and extract the version.
  Run: git describe --tags --exact-match HEAD
  Confirm the git tag matches the manifest version (v prefix on tag).
  Run: git log -1 --format=%s
  Confirm the commit message is "v<VERSION>".

CHECK 2 — CHANGELOG ACCURACY:

  Read the changelog file and find the entry for the new version.
  Run: git log $(git describe --tags --abbrev=0 HEAD~1)..HEAD~1 --oneline
  Compare the changelog entry against the actual commits. Verify:
  - Every significant change is mentioned
  - No fabricated changes are listed
  - The change categories (breaking/feature/fix) are correct

CHECK 3 — SEMVER CORRECTNESS:

  Read the changelog entry and the actual changes.
  Verify the bump type follows semver strictly:
  - If any public API was removed/renamed/changed -> must be major
  - If new public API was added -> must be at least minor
  - If only fixes/internal -> must be patch
  Flag a FAIL if the bump is too conservative (breaking change with
  minor bump) or too aggressive (patch-only changes with major bump).

CHECK 4 — BUILD ARTIFACT VALIDATION:

  List the contents of the build output directory.

  Verify that compiled source files exist for each source module.

  If the project supports multiple module systems (e.g., CJS + ESM):
  - Verify each module format directory exists and contains the expected files
  - Verify any module system marker files are correct (e.g., package.json
    with "type" field in each subdirectory)
  - Test that the artifacts load without error using the appropriate
    runtime import/require mechanism

  If type declarations are expected:
  - Verify .d.ts files (or equivalent) exist

  If source maps are expected:
  - Verify .map files exist

CHECK 5 — PACKAGE EXPORTS:

  Read the manifest file's exports field (if applicable).
  Verify:
  - All export conditions point to files that exist
  - No circular or missing references
  - Type declaration references point to existing files

CHECK 6 — SENSITIVE FILE EXCLUSION:

  Use the dry-run pack command to review what would be published.
  Confirm NONE of these appear in the package:
  - .env, .env.*, credentials*, secrets*
  - .git/, .github/
  - test/, tests/, spec/, __tests__/
  - docs/
  - benchmark or profiling scripts
  - node_modules/ or equivalent dependency directories

  Read the file inclusion/exclusion configuration in the manifest (e.g.,
  "files" field in package.json, .npmignore, MANIFEST.in) and confirm the
  rules are correct.

CHECK 7 — DEPENDENCY AUDIT:

  Run the dependency audit command for the package manager:
  - npm: npm audit --production
  - Other: equivalent audit command

  Confirm no known vulnerabilities in production dependencies.
  If vulnerabilities exist, report severity and affected package.

GATE — PUBLISH READINESS:

  If ALL checks pass:
    Report PASS with a summary of what was validated.
    State: "Ready for human-approved publish."
    State the publish and push commands appropriate for the project's
    package manager and registry.

  If ANY check fails:
    Report FAIL with specific issues and remediation steps.
    Do NOT approve publish.

Report format:
  CHECK 1: PASS | FAIL -- <details>
  CHECK 2: PASS | FAIL -- <details>
  ...
  OVERALL: PASS | FAIL
  PUBLISH GATE: APPROVED | BLOCKED -- <reason>
```

---

## Completion

Update `docs/requirements/sdlc-metadata.yml`:
```yaml
release:
  status: "completed"
  completed: "<today's date>"
```

**Note:** The publish and push commands are intentionally excluded from agent execution. They require human approval and are performed manually after the Release Reviewer passes.

## Coordination Summary

```
Agent 1 (Release Planner) ─────┐
    explore: analyze changes     │
                                 ▼
Agent 2 (Release Author) ──────┐
    write: update files, commit  │
                                 ▼
Agent 3 (Release Reviewer) ────┐
    validate: verify everything  │
                                 ▼
    Fix issues if needed
                                 │
                                 ▼
    Human approves publish
         <publish command>
         git push origin v<VERSION> && git push
```
