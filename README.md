<div align="center">

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗ ██████╗    ███████╗██████╗ ██╗      ██████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║██╔════╝    ██╔════╝██╔══██╗██║     ██╔════╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║██║         ███████╗██║  ██║██║     ██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║██║         ╚════██║██║  ██║██║     ██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║╚██████╗    ███████║██████╔╝███████╗╚██████╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝    ╚══════╝╚═════╝ ╚══════╝ ╚═════╝
```

**A portable, multi-LLM framework that runs the full software lifecycle through a crew of specialized AI agents.**

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0)
[![Standards](https://img.shields.io/badge/Standards-ISO%2012207%20·%20IEEE%201012%20·%20ISO%2025010%20·%20ISO%2027001-informational)](#standards-anchored)
[![Made with](https://img.shields.io/badge/AI-Claude%20·%20Codex%20·%20Aider-8A2BE2)](#quick-start)

</div>

---

## Overview

**Agentic SDLC** turns the seven phases of a Software Product Lifecycle into autonomous AI agents. Point the orchestrator at any codebase — or at an empty folder for greenfield work — and a coordinated crew of ~30 specialized agents handles requirements, design, code, tests, review, release, and operations.

Zero dependencies. One file (`sdlc-cli.mjs`) drives the entire pipeline across **Claude Code**, **OpenAI Codex**, **Aider**, or your clipboard for any other tool.

## The seven phases

```
PREPARE → DEFINE → DESIGN → DEVELOP → VERIFY → RELEASE → OPERATE
                                       ▲                    │
                                       └────── feedback ────┘
```

| # | Phase | Output |
|---|---|---|
| 1 | **Prepare** | Codebase analysis, `CLAUDE.md` cheat sheet |
| 2 | **Define** | Functional and non-functional requirements, user stories |
| 3 | **Design** | Architecture overview, component specs, ADRs (Nygard format) |
| 4 | **Develop** | Per feature: implementation plan → code → tests → review |
| 5 | **Verify** | Coverage, independent review, static analysis, UAT gate |
| 6 | **Release** | Version bump, changelog, release notes |
| 7 | **Operate** | Issue triage, dependency monitoring, incident response |

Every non-functional requirement is tagged with a focus track: **Quality** · **Security** · **Eco-efficiency** · **AI**.

## Quick start

```bash
git clone https://github.com/orchestratedbyalex/agentic-sdlc.git
cd agentic-sdlc
node sdlc-cli.mjs
```

The CLI auto-detects whether the folder contains source code (existing project) or is empty (greenfield), persists progress in `docs/requirements/sdlc-metadata.yml`, and dispatches each phase to the AI tool of your choice. After every phase, simply `/exit` the AI tool — the menu reappears with the next phase ready to run.

## Project structure

```
.
├── sdlc-cli.mjs        # zero-dependency orchestrator
├── docs/agents/        # seven phase playbooks + bootstrap prompts
├── AUTHORS.md
└── LICENSE
```

When the framework is applied to a project, it grows the following structure under `docs/`:

```
docs/
├── requirements/        # FR-*.md, NFR-*.md, US-*.md, traceability matrix
└── design/              # architecture, ADRs, component specs, implementation plans
```

## Design principles

- **Read the rule book first.** Every author agent reads `CLAUDE.md` and existing ADRs before producing anything. Missing information triggers an explicit `AMBIGUITIES` block — never a guess.
- **Reviewer ≠ author.** Phase 5's Independent Code Reviewer is always a fresh agent instance, enforcing Microsoft SDL separation of duties.
- **Plans are contracts.** Each Phase 4 run persists a `PLAN-NNN-<slug>.md` file as the binding agreement between architect, code author, and test author.
- **ADRs are guardrails.** Architecture Decision Records (Nygard format) are written once and treated as constraints by every later phase.

## Standards anchored

ISO/IEC/IEEE 12207 · IEEE 1012 / 1016 · ISO/IEC 25010 · ISO/IEC 27001 · Microsoft SDL · ITIL 4 · Nygard ADRs · Google SRE / DORA

## License & authors

Released under the [PolyForm Noncommercial License 1.0.0](LICENSE) — free for research, education, and personal use. Commercial use is prohibited.

Designed and orchestrated by [@orchestratedbyalex](https://github.com/orchestratedbyalex). See [AUTHORS.md](AUTHORS.md) for full credits.
