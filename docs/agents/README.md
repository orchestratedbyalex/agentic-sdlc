# Agent Specifications — Agentic SDLC

> Orchestrated by [@orchestratedbyalex](https://github.com/orchestratedbyalex) · [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) (no commercial use) · See [AUTHORS.md](../../AUTHORS.md)

This directory contains **agent playbooks** — one per phase of the **Software Development Lifecycle (SDLC)** — that describe the complete workforce needed to execute each phase autonomously. The playbooks are project-agnostic and work for any repository.

This framework is an **agentic implementation of an SDLC** with a product-oriented framing: the seven phases (Prepare, Define, Design, Develop, Verify, Release, Operate) form a single standard lifecycle around a Software Production System, and each phase is supported by a collection of practices, guidelines, tools, and evidence that the agent playbooks help teams produce.

## Purpose

These files are the missing "who does the work" layer. Together with the requirements (what to build) and design (how it's built), they make the entire lifecycle self-describing and reproducible by future agent sessions.

## How an Orchestrator Uses These Files

1. Read `docs/requirements/sdlc-metadata.yml` to find the current phase
2. Find the next phase with `status: pending`
3. Read `docs/agents/phase-<name>.md` for that phase
4. Execute the playbook: spawn agents in the specified order, with the specified prompts, reading the specified inputs, producing the specified outputs
5. Run the reviewer agent to validate
6. Update `sdlc-metadata.yml` to mark the phase as completed

## Schema

Each playbook uses Markdown with YAML frontmatter:

```yaml
---
id: "PHASE-DEFINE"
phase: "define"
phase_number: 2
trigger: "sdlc-metadata.yml shows prepare.status=completed AND define.status=pending"
estimated_agents: 7
standards:
  - "ISO/IEC/IEEE 12207:2017 — ..."
  - "ISO 25010 — ..."
  - "..."
---
```

The body defines each agent with:
- **Role** — what the agent does
- **Type** — explore, plan, write, or validate
- **Parallelism** — how many instances, whether they run concurrently
- **Depends on** — which agents must complete first
- **Input files** — what the agent reads
- **Output files** — what the agent produces
- **Full prompt** — the exact prompt to give the agent
- **Validation** — how to verify the agent's output
- **On failure** — what to do if validation fails

---

## Lifecycle model

### The Software Production System

This SDLC is built around a **Software Production System** (e.g., a SAFe constellation) — multiple teams working together with a shared cadence, standardised way-of-working, and shared policies for security, privacy, and compliance. A Software Production System typically offers a **Developer Experience** (DevEx) layer with platform services, automated compliance, API services, and CI/CD facilities that support all seven phases.

The seven phases wrap around the Software Production System; the same DevOps team that **develops** a product also **operates** it (Phases 4 and 7 are normally owned by one team, not two). The agent playbooks reflect this: the Develop and Operate phases share artifacts (incident reports drive new requirements; runtime telemetry feeds back into requirements).

### Four focus tracks

The framework defines **four cross-cutting focus tracks** that span all seven phases. Each track is anchored to a public quality standard and addresses a non-functional concern that drives the success of modern software products:

| Focus track | Anchor standard | What it covers |
|---|---|---|
| **Quality Lifecycle** | ISO/IEC 25010 — Software product quality model | Functional suitability, performance, compatibility, usability, reliability, security, maintainability, portability |
| **Security Lifecycle** | ISO/IEC 27001 — Information security management | Confidentiality, integrity, availability of data; threat modeling; secure-by-default defaults |
| **Eco-efficiency Lifecycle** | Green IT best practices | Carbon footprint, resource efficiency, energy-aware design |
| **AI Lifecycle** | Best practices and risks for AI use | Responsible AI, model governance, AI-driven productivity (this very framework is an example) |

The focus tracks **do not contain all possible aspects** — only the most important ones. Subsequent specialized tracks (e.g., "Secure Software Lifecycle for Flutter Mobile Apps") add details when needed.

In the playbooks, focus tracks surface in two places:
- **NFR `focus_track` field** (Phase 2) — every non-functional requirement is tagged with its track so teams can audit Quality coverage independently of Security coverage.
- **ADR `focus_track` field** (Phase 3, optional) — architectural decisions driven primarily by one track (e.g., a security-driven decision) are tagged so the security guild can review them as a group.

### Practice categories

For each phase, a collection of practices, guidelines, tools, and evidence is available. Teams decide what is relevant within their specific client context — a practice might be **required** for one client and merely **good** for another. The framework defines five categories:

| Symbol | Category | Meaning |
|---|---|---|
| **RP** | Required Practice | Your team or solution **should comply** with this practice or **document why it is not relevant** |
| **GP** | Good Practice | Practice teams are advised to follow at their own discretion |
| **G** | Guideline | General rules of thumb that can be valuable |
| **Tooling** | Tooling | Tooling that supports compliance and creates evidence |
| **Evidence** | Evidence | Outcome or document that shows compliance is in place |

How the agent playbooks map to these categories:

- **Validation agents** (Reviewer, NFR Validator, Independent Code Reviewer, Validation Reviewer) enforce **RPs** — their PASS/FAIL gates require RP compliance or a documented exception.
- **Author agents** (FR / NFR / US / CS / DI / ADR / Plan authors) produce the **Evidence** that demonstrates RP compliance.
- **Explore agents** (Architecture Explorer, Issue Triager, Dependency Monitor, Telemetry Monitor) generate findings that may surface as **GPs** or **Guidelines**.
- The **CLI orchestrator** (`sdlc-cli.mjs`) and the playbooks themselves are **Tooling** — they support compliance and create evidence automatically.
- When an RP is **not relevant** for a project, teams document the exception in `docs/exceptions/` (or in the relevant requirement / ADR) — the validation agents check for either compliance or an explicit exception.

---

## Authoritative grounding (cross-reference)

Each phase is anchored to recognized standards and frameworks. Below is the cross-standard mapping showing how this 7-phase naming aligns to public industry references.

| This phase | ISO/IEC/IEEE 12207:2017 | PMBOK | ITIL 4 SVC | Microsoft SDL | AWS / TechTarget |
|---|---|---|---|---|---|
| 1. Prepare | (Concept stage; Project Planning) | Initiating + Planning | Plan | Training | Planning |
| 2. Define | Stakeholder Needs + System/SW Requirements Definition | Planning (scope) | Engage | Requirements | Analysis / Requirements |
| 3. Design | Architecture Definition + Design Definition | Planning | Design & Transition | Design | Design |
| 4. Develop | Implementation + Integration | Executing | Obtain/Build | Implementation | Implementation |
| 5. Verify | Verification + Validation (IEEE 1012) | Monitoring & Controlling | Design & Transition (test) | Verification | Testing |
| 6. Release | Transition | Closing (delivery) | Design & Transition (deploy) | Release | Deployment |
| 7. Operate | Operation + Maintenance | (post-project) | Deliver & Support + Improve | Response | Maintenance |

### Key boundaries enforced by these playbooks

| Concern | Where it lives | Source |
|---|---|---|
| Implementation plan (per change request) | Output of Design role; persisted under `docs/design/implementation-plans/` | ISO/IEC/IEEE 12207; IEEE 1016 |
| ADRs (architecture decision records) | Phase 3, one file per decision in `docs/design/adrs/` (Nygard format) | Michael Nygard 2011 |
| Unit tests | Phase 4 (developer authors them alongside code) | Microsoft SDL Implementation; ISO 12207 |
| Integration tests, static/dynamic analysis, independent code review | Phase 5 (Verification group) | IEEE 1012; Microsoft SDL Verification |
| User Acceptance Testing | Phase 5 (Validation group) | IEEE 1012 |
| Reviewer ≠ author | Phase 5 Independent Code Reviewer | Microsoft SDL |
| Quality NFRs (functional suitability, performance, reliability, etc.) | Tagged `focus_track: quality` | ISO 25010 |
| Security NFRs (confidentiality, integrity, availability) | Tagged `focus_track: security` | ISO 27001 |
| Routine operations | Phase 7 (ITIL 4 Deliver & Support) | ITIL 4 |
| Incident response | Phase 7 (Microsoft SDL Response) | Microsoft SDL |
| Develop and Operate are usually the same DevOps team | Acknowledged in Phase 4 + Phase 7 | Software Production System model |

### Authoritative source list

**Focus track anchors:**
- **ISO/IEC 25010** — Software product quality model (Quality Lifecycle anchor) — https://www.iso.org/standard/35733.html
- **ISO/IEC 27001** — Information security management systems (Security Lifecycle anchor) — https://www.iso.org/standard/27001
- Green IT best practices (Eco-efficiency Lifecycle)
- Responsible AI / AI risk frameworks (AI Lifecycle)

**Lifecycle process standards:**
- **ISO/IEC/IEEE 12207:2017** — Software life cycle processes — https://www.iso.org/standard/63712.html
- **IEEE 1012-2016** — System, Software, and Hardware Verification and Validation — https://standards.ieee.org/ieee/1012/7324/
- **IEEE 1016** — Software Design Descriptions
- **Microsoft SDL** — https://learn.microsoft.com/en-us/compliance/assurance/assurance-microsoft-security-development-lifecycle
- **Michael Nygard, "Documenting Architecture Decisions" (2011)** — https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- **ITIL 4 Service Value Chain** — https://www.beyond20.com/blog/what-is-the-itil-4-service-value-chain/
- **PMBOK process groups** — https://www.pmi.org/standards/process-groups
- **NIST SP 800-160 Vol. 1** — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v1.pdf
- **Google SRE / DORA metrics** — https://sre.google/

## Playbooks

| File | Phase | Agents | Status |
|------|-------|--------|--------|
| `phase-1-prepare.md` | Prepare | 2 | Generic |
| `phase-2-define.md` | Define | 7 | Generic — NFRs tagged with `focus_track` |
| `phase-3-design.md` | Design | 6 | Generic — produces ADRs (Nygard) with optional `focus_track` |
| `phase-4-develop.md` | Develop | 6 | Generic — architect plans, developer implements, ambiguity loop |
| `phase-5-verify.md` | Verify | 5 | Generic — verification (4 agents) + validation (1 agent) |
| `phase-6-release.md` | Release | 3 | Generic |
| `phase-7-operate.md` | Operate | 5 | Generic — routine ops (3) + incident response (1) + feedback loop (1) |

Phases 1-3 have been validated through execution. Phases 4-7 follow the same structure and patterns.
