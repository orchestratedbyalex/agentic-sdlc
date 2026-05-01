# How to Use Agent Playbooks with Any LLM

This guide explains how to execute SDLC phases using different LLM providers and coding tools.

## Quick Start

1. Open `bootstrap-develop.md` (or the bootstrap file for your phase)
2. Copy the prompt inside the "Ready-to-Paste Prompt" section
3. Replace `[CHANGE REQUEST]` with your actual task
4. Paste it into your LLM tool of choice
5. The agent reads the playbook and executes the steps

## Provider-Specific Instructions

### Claude Code (CLI or Desktop)

```bash
# Option 1: Paste the bootstrap prompt directly into the conversation

# Option 2: Reference the file
cat docs/agents/bootstrap-develop.md
# Then paste the prompt with your change request filled in
```

Claude Code has native support for Agent subprocesses, so it can run
the 4 Develop agents as actual parallel/sequential subagents. It will
read the playbook file and spawn agents automatically if you ask it to.

### OpenAI Codex

In the Codex task interface, paste the bootstrap prompt as your task
description. Codex will execute in its sandboxed environment.

**Note:** Codex runs in an isolated container. Make sure the repository
is available in the environment. Codex will:
- Read the playbook and context files autonomously
- Make code changes and run tests
- Produce a PR-ready diff

### Cursor (Composer)

In Cursor's Composer (Cmd+I), paste the bootstrap prompt and @-reference
the key files:

```
@docs/agents/phase-4-develop.md
@docs/agents/bootstrap-develop.md
@docs/requirements/traceability-matrix.md
@docs/design/design-traceability.md
@CLAUDE.md

[paste the bootstrap prompt with your change request]
```

Cursor will use the referenced files as context and follow the
step-by-step instructions.

### GitHub Copilot Workspace

Create a new task in Copilot Workspace and paste the bootstrap prompt
as the task description. Copilot Workspace will:
- Generate a plan based on the instructions
- Show you the proposed changes
- Let you refine before committing

### Aider

```bash
# Start aider with the context files pre-loaded
aider \
  --read docs/agents/phase-4-develop.md \
  --read docs/agents/bootstrap-develop.md \
  --read docs/requirements/traceability-matrix.md \
  --read docs/design/design-traceability.md \
  --read CLAUDE.md \
  --message "$(cat <<'EOF'
[paste the bootstrap prompt with your change request]
EOF
)"
```

### Cline (VS Code)

Open Cline in VS Code, paste the bootstrap prompt, and it will
autonomously read files, make changes, and run terminal commands.

### Any Other LLM Agent

The pattern works with any tool that can:
1. Read files from the repository
2. Write/edit files
3. Run shell commands (build, test, lint as defined in CLAUDE.md)

Just give it the bootstrap prompt. The prompt tells it which files to
read and in what order. Everything is self-contained in the repository.

## How It Works

```
┌─────────────────────────────┐
│  You provide:               │
│  - Bootstrap prompt         │
│  - Change request           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Agent reads:               │
│  - phase-4-develop.md       │
│  - traceability-matrix.md   │
│  - Relevant FR/CS docs      │
│  - CLAUDE.md                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Agent executes 4 steps:    │
│  1. Analyze (change plan)   │
│  2. Code (implement)        │
│  3. Test (write tests)      │
│  4. Review (validate)       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Output:                    │
│  - Modified source files    │
│  - New/updated tests        │
│  - Passing test suite       │
└─────────────────────────────┘
```

## Adapting for Other Phases

The same pattern works for any phase. Create a bootstrap file that:

1. States which phase to execute
2. Points to the playbook file (`docs/agents/phase-N-*.md`)
3. Lists the key context files to read first
4. Includes the step-by-step execution order
5. Provides the validation command (see CLAUDE.md for test commands)

### Bootstrap files available

| Phase | Bootstrap file | Status |
|-------|---------------|--------|
| Develop | `bootstrap-develop.md` | Available |
| Verify | Create from `phase-5-verify.md` | Template ready |
| Release | Create from `phase-6-release.md` | Template ready |
| Operate | Create from `phase-7-operate.md` | Template ready |

Phases 1-3 (Prepare, Define, Design) are already completed and don't
need bootstrap files unless you want to re-run them on a different repo.

## Tips

- **Start small.** Try the bootstrap prompt with a simple bug fix before
  attempting a large feature.
- **Check the change plan.** After Agent 1 (Change Analyst) produces a
  plan, review it before letting Agents 2-3 implement. Most LLM tools
  let you intervene between steps.
- **Run tests early.** If your LLM tool supports it, run the test command
  from CLAUDE.md after Agent 2 (Code Author) finishes, before writing
  tests. This catches compilation errors early.
- **Use the traceability matrix.** If you're unsure which FR or CS applies
  to your change, `docs/requirements/traceability-matrix.md` maps every
  test file to its requirements and every requirement to its source files.
