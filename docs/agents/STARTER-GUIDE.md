# Agentic SDLC — Starter Guide

How to set up the agentic SDLC on any new project from scratch.

> This framework implements an **Agentic Software Development Lifecycle (SDLC)** with a product-oriented framing — seven phases (Prepare, Define, Design, Develop, Verify, Release, Operate) wrapped around a Software Production System, with four cross-cutting focus tracks (Quality / Security / Eco-efficiency / AI). Each agent's outputs map to five practice categories: **RP** (Required Practice), **GP** (Good Practice), **G** (Guideline), **Tooling**, and **Evidence** — see `docs/agents/README.md` for the full mapping.

## What You Need

Two things to copy into your new project:

### 1. The Infrastructure Files (copy these)

```
your-project/
├── sdlc-cli.mjs                          # CLI orchestrator
└── docs/
    └── agents/
        ├── README.md                      # Schema docs
        ├── USAGE.md                       # Provider instructions
        ├── STARTER-GUIDE.md               # This file
        ├── bootstrap-develop.md           # Ready-to-paste prompt
        ├── phase-1-prepare.md             # Playbook: Prepare
        ├── phase-2-define.md              # Playbook: Define
        ├── phase-3-design.md              # Playbook: Design
        ├── phase-4-develop.md             # Playbook: Develop
        ├── phase-5-verify.md              # Playbook: Verify
        ├── phase-6-release.md             # Playbook: Release
        └── phase-7-operate.md             # Playbook: Operate
```

**Total: 12 files.** These are all project-agnostic — they work for any codebase.

### 2. The Bootstrap Metadata (created by Phase 1)

These are created automatically as you run phases:

```
your-project/
├── CLAUDE.md                              # Created by Phase 1
└── docs/
    └── requirements/
        ├── sdlc-metadata.yml              # Created by Phase 1
        ├── README.md                      # Created by Phase 2
        ├── review-checklist.md            # Created by Phase 2
        ├── traceability-matrix.md         # Created by Phase 2
        ├── functional/
        │   └── FR-001-*.md ...            # Created by Phase 2
        ├── nonfunctional/
        │   └── NFR-001-*.md ...           # Created by Phase 2
        └── user-stories/
            └── US-001-*.md ...            # Created by Phase 2
    └── design/
        ├── README.md                      # Created by Phase 3
        ├── architecture-overview.md       # Created by Phase 3
        ├── data-flow.md                   # Created by Phase 3
        ├── design-traceability.md         # Created by Phase 3
        ├── adrs/
        │   ├── README.md                  # Created by Phase 3 (ADR index)
        │   └── ADR-001-*.md ...           # Created by Phase 3 (Nygard format)
        ├── component-specs/
        │   └── CS-001-*.md ...            # Created by Phase 3
        ├── dependency-interfaces/
        │   └── DI-001-*.md ...            # Created by Phase 3
        └── implementation-plans/
            └── PLAN-001-*.md ...          # Created by Phase 4 (one per change request)
```

---

## Step-by-Step Setup

### Step 0: Copy the infrastructure

```bash
# From the reference project, copy only the infrastructure files
mkdir -p your-project/docs/agents

# Copy the CLI
cp /path/to/reference/sdlc-cli.mjs your-project/

# Copy all playbooks
cp /path/to/reference/docs/agents/*.md your-project/docs/agents/
```

Or if you have the reference repo as a git remote:
```bash
cd your-project
# Copy just the agent infra (no project-specific docs)
cp -r /path/to/reference/docs/agents/ docs/agents/
cp /path/to/reference/sdlc-cli.mjs .
```

### Step 1: Create the initial metadata

Before the CLI can work, you need a minimal `sdlc-metadata.yml`:

```bash
mkdir -p docs/requirements
```

Create `docs/requirements/sdlc-metadata.yml` with:

```yaml
sdlc:
  project: "your-project-name"
  version: "1.0.0"
  phase: "prepare"
  phase_number: 1
  status: "pending"
  methodology: "agentic-sdlc"

  phases:
    prepare:
      status: "pending"
    define:
      status: "pending"
    design:
      status: "pending"
    develop:
      status: "pending"
    verify:
      status: "pending"
    release:
      status: "pending"
    operate:
      status: "pending"

  requirement_counts:
    functional: 0
    nonfunctional: 0
    user_stories: 0
```

### Step 2: Run Phase 1 — Prepare

You can use the CLI or do it manually with Claude:

**Option A: Using the CLI**
```bash
node sdlc-cli.mjs
# Pick phase 1 (Prepare), pick your LLM tool
```

**Option B: Manually with Claude Code**
```bash
claude "Read docs/agents/phase-1-prepare.md and execute it on this repository. Create a CLAUDE.md file and update docs/requirements/sdlc-metadata.yml to mark prepare as completed."
```

**Option C: Just tell Claude**
```
Analyze this codebase and create a CLAUDE.md file with build/test/lint
commands and high-level architecture. Then update
docs/requirements/sdlc-metadata.yml to set prepare.status to completed.
```

After this step you'll have:
- `CLAUDE.md` at the project root
- `sdlc-metadata.yml` with `prepare.status: completed`

### Step 3: Run Phase 2 — Define

```bash
node sdlc-cli.mjs
# Pick phase 2 (Define), pick your LLM tool
```

This creates all the requirement documents (FR, NFR, US, traceability matrix).

### Step 4: Run Phase 3 — Design

```bash
node sdlc-cli.mjs
# Pick phase 3 (Design), pick your LLM tool
```

This creates architecture, component specs, dependency interfaces, and design decisions.

### Step 5: Start developing

Now you can use the CLI to implement features:

```bash
node sdlc-cli.mjs
# Pick phase 4 (Develop), pick your LLM tool
# Describe your change request
```

---

## Quick Start (Copy-Paste Version)

If you want the absolute fastest setup, run these commands in your project root:

```bash
# 1. Set your reference project path
REF="/path/to/reference/project"

# 2. Copy infrastructure
cp "$REF/sdlc-cli.mjs" .
mkdir -p docs/agents
cp "$REF/docs/agents/"*.md docs/agents/

# 3. Create initial metadata
mkdir -p docs/requirements
cat > docs/requirements/sdlc-metadata.yml << 'EOF'
sdlc:
  project: "my-project"
  version: "0.1.0"
  phase: "prepare"
  phase_number: 1
  status: "pending"
  methodology: "agentic-sdlc"

  phases:
    prepare:
      status: "pending"
    define:
      status: "pending"
    design:
      status: "pending"
    develop:
      status: "pending"
    verify:
      status: "pending"
    release:
      status: "pending"
    operate:
      status: "pending"

  requirement_counts:
    functional: 0
    nonfunctional: 0
    user_stories: 0
EOF

# 4. Run phase 1
node sdlc-cli.mjs
```

---

## File Checklist

Use this to verify your setup is complete:

### Infrastructure (copy before starting)
- [ ] `sdlc-cli.mjs` — CLI orchestrator
- [ ] `docs/agents/README.md` — schema docs
- [ ] `docs/agents/USAGE.md` — provider instructions
- [ ] `docs/agents/STARTER-GUIDE.md` — this guide
- [ ] `docs/agents/bootstrap-develop.md` — develop phase prompt template
- [ ] `docs/agents/phase-1-prepare.md` — Prepare playbook (2 agents)
- [ ] `docs/agents/phase-2-define.md` — Define playbook (7 agents)
- [ ] `docs/agents/phase-3-design.md` — Design playbook (6 agents)
- [ ] `docs/agents/phase-4-develop.md` — Develop playbook (5 agents)
- [ ] `docs/agents/phase-5-verify.md` — Verify playbook (4 agents)
- [ ] `docs/agents/phase-6-release.md` — Release playbook (3 agents)
- [ ] `docs/agents/phase-7-operate.md` — Operate playbook (3 agents)

### Created by Phase 1 (Prepare)
- [ ] `CLAUDE.md` — project guide for LLMs
- [ ] `docs/requirements/sdlc-metadata.yml` — phase tracking (initially created manually, updated by each phase)

### Created by Phase 2 (Define)
- [ ] `docs/requirements/README.md`
- [ ] `docs/requirements/review-checklist.md`
- [ ] `docs/requirements/traceability-matrix.md`
- [ ] `docs/requirements/functional/FR-*.md` (count varies per project)
- [ ] `docs/requirements/nonfunctional/NFR-*.md` (count varies per project)
- [ ] `docs/requirements/user-stories/US-*.md` (count varies per project)

### Created by Phase 3 (Design)
- [ ] `docs/design/README.md`
- [ ] `docs/design/architecture-overview.md`
- [ ] `docs/design/data-flow.md`
- [ ] `docs/design/design-traceability.md`
- [ ] `docs/design/adrs/README.md` (ADR index)
- [ ] `docs/design/adrs/ADR-*.md` (one file per architectural decision, Nygard format)
- [ ] `docs/design/component-specs/CS-*.md` (one per source module)
- [ ] `docs/design/dependency-interfaces/DI-*.md` (one per runtime dependency)
- [ ] `docs/design/implementation-plans/` (initialized empty; populated by Phase 4)

### Created by Phase 4 (Develop) — once per change request
- [ ] `docs/design/implementation-plans/PLAN-*.md` (one file per change request, persisted)
- [ ] `docs/requirements/functional/FR-*.md` (new FR for each new feature, via Requirements Sync)
- [ ] `docs/requirements/user-stories/US-*.md` (new US for each new feature, via Requirements Sync)

---

## FAQ

**Q: Do I need to run phases 1-3 before I can develop?**
Yes. Phases 1-3 create the context that the Develop phase agents read. Without requirements and design docs, the Develop agents won't know what acceptance criteria to meet or which files to modify.

**Q: How long do phases 1-3 take?**
Depends on codebase size. For a small-to-medium project (5-20 source files), each phase takes 5-15 minutes with a capable LLM.

**Q: Can I skip phases?**
Not recommended. Each phase builds on the previous one. But if you only want the Develop workflow, you could manually create a minimal CLAUDE.md and skip Define/Design — the Develop agents will still work, just without the traceability benefits.

**Q: What if my project isn't JavaScript/TypeScript?**
The playbooks are language-agnostic. They reference "package.json or equivalent manifest" everywhere. Works for Python (pyproject.toml), Rust (Cargo.toml), Go (go.mod), etc.

**Q: What if I don't have tests yet?**
Phase 2 will note the absence of tests. Phase 4 (Develop) includes a Test Author agent that creates tests for new features. You'll build up test coverage as you develop.

**Q: Can I use this with a monorepo?**
Yes, but you'd set up the SDLC structure in each package/workspace separately, or at the repo root with CLAUDE.md describing the monorepo structure.
