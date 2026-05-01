---
id: "PHASE-OPERATE"
phase: "operate"
phase_number: 7
trigger: "sdlc-metadata.yml shows release.status=completed AND operate.status=pending"
estimated_agents: 4
evidence: "template — project-agnostic playbook"
standards:
  - "ISO/IEC/IEEE 12207:2017 — Operation + Maintenance processes"
  - "ITIL 4 — Deliver & Support + Improve value chain activities"
  - "Microsoft SDL — Response (post-release security incident handling)"
  - "Google SRE — service reliability and incident management"
  - "ISO/IEC 27001 — Information security management (basis for security incident response)"
  - "Software Production System — same DevOps team develops + operates"
---

# Phase 7: Operate

Run the deployed software, listen to it, and feed findings back into the SDLC. This phase covers two distinct concerns per the standards:

1. **Routine operations** (ITIL 4 Deliver & Support) — issue triage, dependency health, telemetry/health monitoring, proactive maintenance
2. **Incident response** (Microsoft SDL Response) — handle security advisories, critical bugs, and post-incident learning

Operate closes the SDLC loop: findings here trigger a new Define phase if changes are needed.

**Inputs:** deployed software, telemetry/issue tracker data, user feedback, dependency advisories, incident reports.
**Outputs:** triage report, dependency health report, incident reports (if any), new requirement documents (for new feature requests / bug reports), updated SDLC cycle state.

> **Lifecycle note.** In the Software Production System model, the same DevOps team that operates the product (this phase) also developed it (Phase 4). Findings here flow back to the same team, not to a separate operations group. The Incident Responder agent is the same team's "post-release" capacity, not a handoff to a different team. This is why operate findings can reset Phase 4 to `pending` directly — the team that needs to act on the finding is already the team that runs Develop.

## Authoritative grounding

| Concept | Source |
|---|---|
| Operation + Maintenance as separate processes | ISO/IEC/IEEE 12207:2017 |
| Deliver & Support = routine ops | ITIL 4 Service Value Chain |
| Improve = continuous learning loop | ITIL 4 |
| Response = post-release security incident handling | Microsoft SDL |
| DORA / SRE metrics for operational health | Google SRE; DORA "Accelerate" research |

## Prerequisites

- Phase 6 (Release) completed
- Software deployed / package published
- `docs/requirements/sdlc-metadata.yml` shows `release.status=completed`
- GitHub CLI (`gh`) authenticated with repository access (or equivalent issue tracker)

## Setup (before agents)

```bash
gh auth status
gh repo view --json nameWithOwner -q .nameWithOwner
mkdir -p docs/operate
```

---

## Group A — Routine Operations (ITIL 4 Deliver & Support)

### Agent 1: Issue Triager

- **Type:** explore
- **Count:** 1 (parallel with Agents 2 and 3)
- **Parallelism:** simultaneous with Agent 2 and Agent 3
- **Depends on:** setup complete
- **Input files:** GitHub issues (via `gh` CLI), `docs/requirements/`, `docs/design/component-specs/*.md`
- **Output:** triage report
- **Validation:** none (informational)

### Full Prompt

```
You are the Issue Triager agent. Read all open issues, categorize them
against existing requirements and components, produce a prioritized triage
report.

STEP 0 — DISCOVER THE PROJECT

Read CLAUDE.md.

STEP 1 — Fetch open issues:

  gh issue list --state open --limit 100 --json number,title,labels,createdAt,comments,body

  If more than 100 issues, append --paginate.

  Also fetch recently closed issues for context:
  gh issue list --state closed --limit 30 --json number,title,labels,closedAt,body

STEP 2 — Read requirements & components:

  List and read every file in:
  - docs/requirements/functional/
  - docs/requirements/nonfunctional/
  - docs/requirements/user-stories/
  - docs/design/component-specs/
  - docs/design/adrs/

  Build a mental map of which kinds of issues map to which FRs/NFRs/CSs.

STEP 3 — Categorize each open issue:

  For each issue, determine:
  a) TYPE: bug | feature-request | question | documentation | duplicate |
           security
  b) RELATED FR: which FR-XXX (or "NEW" if no FR covers it)
  c) RELATED NFR: which NFR-XXX (if applicable)
  d) RELATED CS: which CS-XXX
  e) SEVERITY:
     - P0/critical: crashes, data loss, security vulnerability
     - P1/high: incorrect results, broken on a supported platform
     - P2/medium: edge case, workaround exists
     - P3/low: cosmetic
  f) FREQUENCY: check comments and reactions for high-impact issues
     (gh issue view <NUMBER> --json reactions,comments)

  ANY issue with type=security or severity=P0 must ALSO be flagged for the
  Incident Responder (Agent 4).

STEP 4 — Identify patterns:

  - Multiple issues about the same FR → that feature area needs attention
  - Issues not covered by any FR → requirement gap
  - Issues about the same CS → component may need refactoring
  - Performance complaints → performance NFR thresholds may need revision

STEP 5 — Produce the triage report:

  ## Issue Triage Report — <today's date>

  ### Summary
  - Total open issues: N
  - By type: N bugs, N features, N questions, N docs, N security
  - By severity: N P0, N P1, N P2, N P3

  ### Critical Issues (P0/P1)
  | # | Title | Type | FR | NFR | CS | Severity |

  ### Security/Incident Flags
  Issues routed to Incident Responder (Agent 4).
  | # | Title | Severity | Reason |

  ### Requirement Gaps
  | # | Title | Proposed FR/NFR | Rationale |

  ### Pattern Analysis
  - Most affected component: CS-XXX (N issues)
  - Most affected requirement: FR-XXX (N issues)
  - Emerging themes: <description>

  ### Recommendations
  Prioritized list of actions for the next SDLC cycle.
```

### Agent 2: Dependency Monitor

- **Type:** explore
- **Count:** 1 (parallel with Agents 1 and 3)
- **Parallelism:** simultaneous with Agent 1 and Agent 3
- **Depends on:** setup complete
- **Input files:** package manifest, lockfile, `docs/requirements/nonfunctional/*.md`, `docs/design/dependency-interfaces/*.md`
- **Output:** dependency health report

### Full Prompt

```
You are the Dependency Monitor agent. Check health of all dependencies and
produce an update recommendation.

STEP 0 — DISCOVER

Read CLAUDE.md (package manager) and the manifest.

STEP 1 — Outdated check:
  - npm: npm outdated --json
  - pip: pip list --outdated --format=json
  - cargo: cargo outdated
  - other: equivalent

For each: current vs wanted vs latest, in-range vs out-of-range.

STEP 2 — Read DI docs in docs/design/dependency-interfaces/.

These document exactly which methods/classes the project depends on. Use
them to assess update risk.

STEP 3 — Classify each outdated dep:
  - SAFE: patch within range
  - MODERATE: minor, no API breaks to interfaces we use
  - RISKY: major, may break DI contracts
  - SECURITY: addresses a known vulnerability (also flag to Agent 4)

STEP 4 — Security audit:
  - npm audit --json (or pip-audit, cargo audit)
  - For each advisory: severity, package, fix availability
  - ANY critical/high advisory ALSO flag to Incident Responder (Agent 4)

STEP 5 — Runtime compatibility:
  - Check engine constraints in manifest
  - EOL approaching? New LTS available?
  - Cross-reference with compatibility NFR

STEP 6 — Produce dependency health report:

  ## Dependency Health Report — <today's date>
  ### Summary
  - Total deps: N (production) + N (dev)
  - Outdated: N
  - Security advisories: N (critical/high/moderate/low breakdown)
  - Runtime EOL risk: <assessment>

  ### Update Recommendations
  | Package | Current | Latest | Risk | Action | DI Doc |

  Priority:
  1. SECURITY (immediate — also routed to Incident Responder)
  2. SAFE (next release)
  3. MODERATE (evaluate next develop phase)
  4. RISKY (next major version)

  ### Security/Incident Flags
  Advisories routed to Incident Responder (Agent 4).
  | Severity | Package | CVE | Fix |

  ### NFR Impact
  - Compatibility NFR: <impact>
  - Security NFR: <outstanding vulns>

  ### Recommendations for Next SDLC Cycle
```

### Agent 3: Telemetry & Health Monitor

> Optional but recommended for any project with deployed runtime telemetry. Skip if no telemetry exists yet (record the gap as a recommendation).

- **Type:** explore
- **Count:** 1 (parallel with Agents 1 and 2)
- **Parallelism:** simultaneous with Agents 1 and 2
- **Depends on:** setup complete
- **Input files:** any telemetry dashboards / metrics endpoints / log queries referenced in CLAUDE.md or `docs/operate/`, `docs/requirements/nonfunctional/*.md`
- **Output:** health report

### Full Prompt

```
You are the Telemetry & Health Monitor agent.

STEP 0 — DISCOVER TELEMETRY SOURCES

Read CLAUDE.md and docs/operate/ for any references to:
  - Dashboards (Grafana, Datadog, CloudWatch, etc.)
  - Metrics endpoints (/metrics, Prometheus exporters)
  - Log aggregators
  - APM
  - Error trackers (Sentry, Bugsnag, etc.)

If NONE exist:
  Note "no telemetry configured" and recommend establishing baseline metrics.
  Skip to Step 4 with this gap as the only finding.

STEP 1 — DORA / SRE METRICS

Where possible, gather:
  - Deployment frequency
  - Lead time for changes
  - Change failure rate
  - Mean time to recovery
  - Service availability / error rate
  - p50/p95/p99 latency for key user journeys

STEP 2 — NFR COMPLIANCE CHECK

For each performance/availability NFR, find the relevant metric and verify
it meets the threshold.

STEP 3 — ANOMALY DETECTION

Look for unusual patterns in the last 7 / 30 / 90 days:
  - Error rate spikes
  - Latency increases
  - Traffic anomalies
  - New error types after the most recent release

STEP 4 — REPORT

  ## Telemetry & Health Report — <today's date>

  ### Telemetry Sources Found
  - <list, or "none configured">

  ### DORA Metrics
  | Metric | Value | Trend (vs prior period) |

  ### NFR Compliance
  | NFR ID | Metric | Threshold | Actual | Status |

  ### Anomalies / Trends
  - <list>

  ### Recommendations
  - <prioritized list>
```

---

## Group B — Incident Response (Microsoft SDL Response)

### Agent 4: Incident Responder

> Invoked when Agent 1 flags a security/P0 issue, OR Agent 2 finds a critical/high security advisory, OR Agent 3 detects a major SLO breach. Otherwise this agent records "no incidents this period" and exits quickly.

- **Type:** validate + write
- **Count:** 0..N (one report per incident)
- **Parallelism:** sequential, after Agents 1, 2, 3
- **Depends on:** Agents 1, 2, 3 (consumes their flagged items)
- **Input files:** flagged items from Agents 1-3, all relevant requirements, ADRs, source code
- **Output files:** `docs/operate/incident-<YYYY-MM-DD>-<slug>.md` (one per incident)

### Full Prompt

```
You are the Incident Responder agent (Microsoft SDL Response role).

INPUTS:
- Issue Triager security/P0 flags
- Dependency Monitor critical/high advisories
- Telemetry SLO breaches

If no flagged items: write a single line "No incidents this period." and
exit.

For each flagged item:

STEP 1 — INCIDENT TRIAGE

  - Classify: SECURITY_VULN | CRITICAL_BUG | SLO_BREACH | DEP_VULN
  - Determine impact: who is affected, what data/service is at risk
  - Determine urgency: hotfix needed | next-release-fine

STEP 2 — ROOT CAUSE ANALYSIS

  Read the relevant source code, ADRs, and any prior incidents in
  docs/operate/. Identify root cause. Avoid blame; focus on the system.

STEP 3 — CONTAINMENT / MITIGATION

  Recommend:
  - Immediate mitigations (workaround, feature flag off, rate limit)
  - Permanent fix (which FR/CS to modify; whether a new ADR is needed)

STEP 4 — WRITE INCIDENT REPORT

  Create: docs/operate/incident-<YYYY-MM-DD>-<slug>.md

  ---
  id: "INC-NNN"
  type: "incident-report"
  classification: "SECURITY_VULN | CRITICAL_BUG | SLO_BREACH | DEP_VULN"
  severity: "P0|P1"
  detected: "<when>"
  reporter: "issue-triager-agent | dependency-monitor-agent |
              telemetry-monitor-agent | external"
  source_issue: "<github issue # or CVE>"
  affected_fr: [<list>]
  affected_nfr: [<list>]
  affected_components: [<CS IDs>]
  status: "open | mitigated | resolved"
  ---

  # INC-NNN: <Title>

  ## Summary
  ## Impact
  ## Timeline
  ## Root Cause
  ## Containment / Mitigation Applied
  ## Permanent Fix Plan
  ## Lessons Learned (post-mortem)
  ## Action Items (route to next SDLC cycle)

STEP 5 — ROUTE TO NEXT CYCLE

  For each action item, output a structured handoff:

  | Action | Target Phase | Required Artifact |
  |--------|--------------|-------------------|
  | Patch CVE-XXX in dep Y | Develop | new PLAN-NNN |
  | Add NFR for SLO-X | Define | new NFR-NNN |
```

---

## Group C — Feedback Loop (closes the SDLC)

### Agent 5: Feedback Loop Agent

- **Type:** write
- **Count:** 1
- **Parallelism:** sequential (last agent)
- **Depends on:** Agents 1, 2, 3, 4
- **Input files:** all reports from Agents 1-4, sdlc-metadata.yml, requirements
- **Output files:** new FR/NFR/US documents (if gaps found), updated traceability matrix, `docs/operate/operate-report-<date>.md`, updated sdlc-metadata.yml

### Full Prompt

```
You are the Feedback Loop Agent. Take findings from Agents 1-4, decide if
a new SDLC cycle is needed, update project docs accordingly.

STEP 1 — Assess overall state:
  a) STABLE — no critical issues, no security advisories, all deps healthy.
     No new cycle.
  b) MAINTAIN — minor issues or safe dependency updates. Patch cycle
     (Define optional, Develop → Verify → Release).
  c) EVOLVE — new feature requests or moderate dep updates. Full cycle.
  d) URGENT — critical bugs, security vulnerabilities, breaking dep
     changes. Expedited cycle, prioritized scope.

If any incidents from Agent 4 are unresolved: state is at minimum URGENT.

STEP 2 — Create new requirement documents (if Issue Triager identified gaps):

  For each gap, list docs/requirements/functional/ to find next FR-XXX.
  Create FR file using existing schema, status: "proposed", source:
  "github-issue", source_issues: [<numbers>], reviewer: "pending".

  Same pattern for NFR and US.

STEP 3 — Update traceability matrix.

  Append rows for new FR/NFR/US, mark source_files / test_files as "TBD".

STEP 4 — Write the operate report:

  Create docs/operate/operate-report-<YYYY-MM-DD>.md

  ---
  id: "OPS-REPORT-<YYYY-MM-DD>"
  type: "operate-report"
  cycle_assessment: "STABLE|MAINTAIN|EVOLVE|URGENT"
  new_requirements: <count>
  incidents: <count from Agent 4>
  ---

  # Operate Report — <date>
  ## Cycle Assessment: <STABLE|MAINTAIN|EVOLVE|URGENT>
  ## Issue Triage Summary
  ## Dependency Health Summary
  ## Telemetry / Health Summary
  ## Incidents
  | INC-ID | Severity | Status | Action |
  ## New Requirements Created
  | ID | Title | Source | Priority |
  ## Recommended Next Actions
  ## SDLC Cycle Decision

STEP 5 — Update sdlc-metadata.yml:

  STABLE:
    operate:
      status: "completed"
      completed: "<today's date>"
      assessment: "stable"
      next_cycle: false

  MAINTAIN:
    operate:
      status: "completed"
      completed: "<today's date>"
      assessment: "maintain"
      next_cycle: true
      next_cycle_scope: "<description>"
    define:
      status: "completed"      # keep — just bug fixes
    design:
      status: "completed"
    develop:
      status: "pending"
    verify:
      status: "pending"
    release:
      status: "pending"
    operate:
      status: "pending"

  EVOLVE: full reset to define=pending and downstream pending.

  URGENT: same as MAINTAIN but add:
    urgent:
      triggered: "<today's date>"
      reason: "<incident IDs>"
      scope: "<specific issues>"

  Increment a cycle counter to track iterations.

Report what was done.
```

---

## Completion

Update `docs/requirements/sdlc-metadata.yml`:
```yaml
operate:
  status: "completed"
  completed: "<today's date>"
  cycle_count: <incremented>
  routine_ops:
    open_issues: XX
    outdated_deps: XX
    security_advisories: XX
  incidents: <count>
  next_cycle: <true|false>
  next_cycle_scope: "<description if applicable>"
```

If a new cycle is triggered, the orchestrator reads the updated metadata, finds the first phase with `status: pending`, begins it.

## Coordination Summary

```
GROUP A — ROUTINE OPS (parallel)
                                 ┐
Agent 1 (Issue Triager) ─────────┤
Agent 2 (Dependency Monitor) ────┤  parallel
Agent 3 (Telemetry Monitor) ─────┘
                                 ▼
GROUP B — INCIDENT RESPONSE (conditional)
                                 │
Agent 4 (Incident Responder) ────┐
    sequential, only if flags     │
    raised by Agents 1/2/3        │
                                  ▼
GROUP C — FEEDBACK LOOP
                                 │
Agent 5 (Feedback Loop) ─────────┐
    sequential, last              │
    creates new FR/US,            │
    decides cycle disposition     │
                                  ▼
    If next_cycle=true:
        Orchestrator reads sdlc-metadata.yml,
        finds first pending phase,
        begins next cycle
                                  │
    If next_cycle=false:           │
        SDLC complete; monitor on  │
        next scheduled run         │
```
