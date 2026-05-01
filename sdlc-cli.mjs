#!/usr/bin/env node

// Agentic SDLC orchestrator — implements a Software Development Lifecycle
// with a product-oriented framing: seven phases (Prepare → Operate) around
// a Software Production System, with four cross-cutting focus tracks
// (Quality, Security, Eco, AI). See docs/agents/README.md for the full
// standards alignment.
//
// Orchestrated by @orchestratedbyalex · PolyForm Noncommercial 1.0.0 · See AUTHORS.md

import readline from 'node:readline'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from 'node:fs'
import { execSync, spawn } from 'node:child_process'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── ANSI helpers ────────────────────────────────────────────────
const esc = code => `\x1b[${code}m`
const green = s => `${esc(32)}${s}${esc(0)}`
const yellow = s => `${esc(33)}${s}${esc(0)}`
const gray = s => `${esc(90)}${s}${esc(0)}`
const bold = s => `${esc(1)}${s}${esc(0)}`
const cyan = s => `${esc(36)}${s}${esc(0)}`
const dim = s => `${esc(2)}${s}${esc(0)}`

// ── Phase definitions ───────────────────────────────────────────
const PHASES = [
  { num: 1, name: 'Prepare', key: 'prepare', file: 'phase-1-prepare.md', desc: 'Analyze codebase, create CLAUDE.md' },
  { num: 2, name: 'Define', key: 'define', file: 'phase-2-define.md', desc: 'Reverse-engineer requirements (FR, NFR, US)' },
  { num: 3, name: 'Design', key: 'design', file: 'phase-3-design.md', desc: 'Architecture, component specs, ADRs (Nygard)' },
  { num: 4, name: 'Develop', key: 'develop', file: 'phase-4-develop.md', desc: 'Architect plan + code + unit tests (per change)', repeatable: true },
  { num: 5, name: 'Verify', key: 'verify', file: 'phase-5-verify.md', desc: 'Verification (independent review, analysis) + Validation (UAT)' },
  { num: 6, name: 'Release', key: 'release', file: 'phase-6-release.md', desc: 'Version bump, changelog, publish prep' },
  { num: 7, name: 'Operate', key: 'operate', file: 'phase-7-operate.md', desc: 'Routine ops + incident response + feedback loop' },
]

// ── Tool definitions ────────────────────────────────────────────
const TOOLS = [
  { name: 'Claude Code', cmd: 'claude' },
  { name: 'OpenAI Codex', cmd: 'codex' },
  { name: 'Aider', cmd: 'aider' },
  { name: 'Copy to clipboard', cmd: null },
]

const METADATA_PATH = join(__dirname, 'docs/requirements/sdlc-metadata.yml')

// ── Readline helper ─────────────────────────────────────────────
function ask(question, defaultVal) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    const suffix = defaultVal ? ` ${gray(`[${defaultVal}]`)} ` : ' '
    rl.question(question + suffix, answer => {
      rl.close()
      resolve(answer.trim() || defaultVal || '')
    })
  })
}

async function confirm(question, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N'
  const answer = await ask(`${question} (${hint})`, defaultYes ? 'y' : 'n')
  return answer.toLowerCase() === 'y'
}

// ── Header ──────────────────────────────────────────────────────
function printHeader(project, version) {
  const title = 'Agentic SDLC'
  const sub = project ? `${project} · v${version}` : 'New Project Setup'
  const width = 34

  console.log()
  console.log(cyan(`  ╭${'─'.repeat(width)}╮`))
  console.log(cyan(`  │${title.padStart((width + title.length) / 2).padEnd(width)}│`))
  console.log(cyan(`  │${sub.padStart((width + sub.length) / 2).padEnd(width)}│`))
  console.log(cyan(`  ╰${'─'.repeat(width)}╯`))
  console.log()
}

// ── Phase status display ────────────────────────────────────────
function printStatus(metadata) {
  console.log(bold('  Phase Status:'))

  let nextPending = null

  for (const phase of PHASES) {
    const status = metadata.phases[phase.key] || 'pending'
    const num = `${phase.num}.`
    const name = phase.name.padEnd(10)

    if (status === 'completed' && phase.repeatable) {
      console.log(`  ${green('✓')} ${num} ${green(name)} ${green('[done]')}  ${cyan('repeatable')}  ${dim(phase.desc)}`)
    } else if (status === 'completed') {
      console.log(`  ${green('✓')} ${num} ${green(name)} ${green('[done]')}              ${dim(phase.desc)}`)
    } else if (!nextPending) {
      nextPending = phase.num
      console.log(`  ${yellow('→')} ${num} ${yellow(name)} ${yellow('[next]')}              ${dim(phase.desc)}`)
    } else {
      console.log(`  ${gray('·')} ${num} ${gray(name)} ${gray('[pending]')}           ${dim(phase.desc)}`)
    }
  }
  console.log()
  return nextPending
}

// ── Parse YAML metadata ─────────────────────────────────────────
function parseMetadataFromContent(content) {
  const result = { project: '', version: '', phases: {} }
  const lines = content.split('\n')
  let currentPhase = null
  let inPhases = false

  for (const line of lines) {
    const projMatch = line.match(/^\s{2}project:\s*"?([^"]+)"?/)
    if (projMatch) result.project = projMatch[1].trim()

    const verMatch = line.match(/^\s{2}version:\s*"?([^"]+)"?/)
    if (verMatch) result.version = verMatch[1].trim()

    if (/^\s{2}phases:/.test(line)) { inPhases = true; continue }
    if (inPhases && /^\s{2}\w/.test(line) && !/^\s{4}/.test(line)) inPhases = false

    if (inPhases) {
      const phaseMatch = line.match(/^\s{4}(\w+):/)
      if (phaseMatch) currentPhase = phaseMatch[1]
      const statusMatch = line.match(/^\s{6}status:\s*"?([^"]+)"?/)
      if (statusMatch && currentPhase) result.phases[currentPhase] = statusMatch[1].trim()
    }
  }
  return result
}

function loadMetadata() {
  if (!existsSync(METADATA_PATH)) return null
  return parseMetadataFromContent(readFileSync(METADATA_PATH, 'utf8'))
}

// ── Detect project state ────────────────────────────────────────
function detectState() {
  const hasMetadata = existsSync(METADATA_PATH)
  const hasCode = existsSync(join(__dirname, 'package.json'))
    || existsSync(join(__dirname, 'Cargo.toml'))
    || existsSync(join(__dirname, 'pyproject.toml'))
    || existsSync(join(__dirname, 'go.mod'))
    || readdirSync(__dirname).some(f => f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.rs') || f.endsWith('.go'))
  const hasPlaybooks = existsSync(join(__dirname, 'docs/agents/phase-1-prepare.md'))

  return { hasMetadata, hasCode, hasPlaybooks }
}

// ── Detect installed tools ──────────────────────────────────────
function detectTools() {
  return TOOLS.map(tool => {
    if (!tool.cmd) return { ...tool, installed: true }
    try {
      execSync(`which ${tool.cmd}`, { stdio: 'pipe' })
      return { ...tool, installed: true }
    } catch {
      return { ...tool, installed: false }
    }
  })
}

// ── Pick a tool ─────────────────────────────────────────────────
async function pickTool(tools) {
  console.log(bold('  Available LLM tools:'))
  tools.forEach((tool, i) => {
    const num = `${i + 1}.`
    if (!tool.cmd) {
      console.log(`  ${num} ${tool.name}`)
    } else if (tool.installed) {
      console.log(`  ${num} ${tool.name}  ${green('✓')}`)
    } else {
      console.log(`  ${num} ${gray(`${tool.name}  ✗ not installed`)}`)
    }
  })
  console.log()

  const toolInput = await ask('  Which tool?', '1')
  const idx = parseInt(toolInput, 10) - 1

  if (isNaN(idx) || idx < 0 || idx >= tools.length) {
    console.log(`  ${yellow('!')} Invalid selection.`)
    return null
  }

  const selected = tools[idx]
  if (selected.cmd && !selected.installed) {
    console.log(`  ${yellow('!')} ${selected.name} is not installed.`)
    return null
  }

  return selected
}

// ── Assemble prompt ─────────────────────────────────────────────
function assemblePrompt(phaseNum, changeRequest) {
  // Develop phase: use bootstrap template with change request
  if (phaseNum === 4 && changeRequest) {
    const bootstrapPath = join(__dirname, 'docs/agents/bootstrap-develop.md')
    if (!existsSync(bootstrapPath)) {
      const phase = PHASES[phaseNum - 1]
      return readFileSync(join(__dirname, 'docs/agents', phase.file), 'utf8')
    }
    const content = readFileSync(bootstrapPath, 'utf8')
    const parts = content.split('````')
    if (parts.length < 2) {
      console.error('  Error: Could not parse bootstrap file.')
      process.exit(1)
    }
    let prompt = parts[1].trim()
    prompt = prompt.replace(/\[CHANGE REQUEST[^\]]*\]/s, changeRequest)
    return prompt
  }

  // Load the playbook
  const phase = PHASES[phaseNum - 1]
  let prompt = readFileSync(join(__dirname, 'docs/agents', phase.file), 'utf8')

  // For greenfield projects (phases 1-3), inject the project brief
  if (phaseNum <= 3 && existsSync(BRIEF_PATH)) {
    const brief = readFileSync(BRIEF_PATH, 'utf8')
    const greenfield = `
IMPORTANT: This is a GREENFIELD project — there is no existing code yet.
Instead of analyzing an existing codebase, use the project brief below
to guide your work.

For Phase 1 (Prepare): Create CLAUDE.md based on the planned architecture,
scaffold the project (package.json, tsconfig, src/, test/ directories),
and create initial entry point files.

For Phase 2 (Define): Write requirements based on what the project SHOULD
do (from the brief), not what it currently does.

For Phase 3 (Design): Design the architecture for the planned features,
not reverse-engineer from existing code.

--- PROJECT BRIEF ---
${brief}
--- END BRIEF ---
`
    prompt = greenfield + '\n\n' + prompt
  }

  return prompt
}

// ── Launch tool ─────────────────────────────────────────────────
function launchTool(tool, prompt) {
  return new Promise(resolve => {
    if (!tool.cmd) {
      try {
        execSync('pbcopy', { input: prompt })
        console.log(`  ${green('✓')} Copied to clipboard (${prompt.split(/\s+/).length} words)`)
        console.log(`  ${gray('Paste into your LLM tool of choice.')}`)
      } catch {
        console.error('  Error: pbcopy not available')
      }
      return resolve(0)
    }

    const wordCount = prompt.split(/\s+/).length
    console.log(`  ${green('✓')} Assembled prompt (${wordCount} words)`)
    console.log(`  ${green('✓')} Launching ${bold(tool.name)}...\n`)
    console.log(gray('  ─'.repeat(20)))
    console.log()

    // Prefix so prompt never starts with --- (parsed as CLI flag)
    const safePrompt = `Execute the following SDLC phase playbook. Read it carefully and follow all instructions.\n\n${prompt}`

    let child
    if (tool.cmd === 'aider') {
      const tmpFile = join(__dirname, '.sdlc-prompt.tmp')
      writeFileSync(tmpFile, safePrompt)
      child = spawn(tool.cmd, ['--message-file', tmpFile], {
        stdio: 'inherit', cwd: __dirname,
      })
    } else if (tool.cmd === 'codex') {
      child = spawn(tool.cmd, ['--full-auto', safePrompt], {
        stdio: 'inherit', cwd: __dirname,
      })
    } else {
      child = spawn(tool.cmd, [safePrompt], {
        stdio: 'inherit', cwd: __dirname,
      })
    }

    child.on('close', code => {
      console.log()
      console.log(gray('  ─'.repeat(20)))
      if (code === 0) {
        console.log(`  ${green('✓')} ${tool.name} finished successfully`)
      } else {
        console.log(`  ${yellow('!')} ${tool.name} exited with code ${code}`)
      }
      resolve(code)
    })
  })
}

// ── Project brief path ──────────────────────────────────────────
const BRIEF_PATH = join(__dirname, 'docs/project-brief.md')

// ── Collect greenfield project brief ────────────────────────────
async function collectBrief() {
  console.log(bold('  Tell me about what you want to build:\n'))

  const description = await ask('  What does this project do?\n  >')
  const language = await ask('  Language/framework?', 'TypeScript + Node.js')
  const features = await ask('  Key features (comma-separated):\n  >')
  const audience = await ask('  Who is the target user?', 'developers')

  const brief = `# Project Brief

## Description
${description}

## Tech Stack
${language}

## Key Features
${features.split(',').map(f => `- ${f.trim()}`).join('\n')}

## Target Users
${audience}
`
  mkdirSync(join(__dirname, 'docs'), { recursive: true })
  writeFileSync(BRIEF_PATH, brief)
  console.log()
  console.log(`  ${green('✓')} Saved project brief to ${bold('docs/project-brief.md')}`)

  return brief
}

// ── Create initial metadata ─────────────────────────────────────
async function createMetadata(mode) {
  const project = await ask('  Project name?', basename(__dirname))
  const version = await ask('  Version?', '0.1.0')

  const content = `sdlc:
  project: "${project}"
  version: "${version}"
  mode: "${mode}"
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
`
  mkdirSync(join(__dirname, 'docs/requirements'), { recursive: true })
  writeFileSync(METADATA_PATH, content)
  console.log()
  console.log(`  ${green('✓')} Created ${bold('docs/requirements/sdlc-metadata.yml')}`)
  console.log(`  ${green('✓')} Project: ${bold(project)} v${version} (${mode})`)
  console.log()

  return parseMetadataFromContent(content)
}

// ── Run a single phase ──────────────────────────────────────────
async function runPhase(phaseNum, tools, changeRequest) {
  const phase = PHASES[phaseNum - 1]
  console.log(bold(`\n  ── Phase ${phase.num}: ${phase.name} ──`))
  console.log(`  ${dim(phase.desc)}\n`)

  const tool = await pickTool(tools)
  if (!tool) return false

  let cr = changeRequest
  if (phaseNum === 4 && !cr) {
    console.log()
    cr = await ask('  Describe your change request:\n  >')
    if (!cr) {
      console.log(`  ${yellow('!')} No change request provided.`)
      return false
    }
  }

  console.log()
  const prompt = assemblePrompt(phaseNum, cr)
  const code = await launchTool(tool, prompt)
  return code === 0
}

// ════════════════════════════════════════════════════════════════
// MAIN — Guided wizard
// ════════════════════════════════════════════════════════════════
async function main() {
  const state = detectState()
  const tools = detectTools()

  // ── First run: no metadata file ──
  if (!state.hasMetadata) {
    printHeader(null, null)

    if (!state.hasPlaybooks) {
      console.log(yellow('  ⚠ No playbook files found in docs/agents/.'))
      console.log(`  Copy them from the reference project first.`)
      console.log(`  See docs/agents/STARTER-GUIDE.md for instructions.\n`)
      process.exit(1)
    }

    // Ask what the user wants to do
    console.log(bold('  How would you like to start?\n'))
    if (state.hasCode) {
      console.log(`  ${green('✓')} Source code detected in this folder\n`)
    }
    console.log(`  1. ${cyan('Build something new from scratch')}`)
    console.log(`     ${dim('Describe your idea and agents will create the project')}`)
    console.log()
    console.log(`  2. ${cyan('Work on existing code')}`)
    console.log(`     ${dim('Agents will analyze your codebase and set up the SDLC')}`)
    console.log()

    const mode = await ask('  >', state.hasCode ? '2' : '1')

    if (mode === '1') {
      // ── Greenfield: collect project brief ──
      console.log()
      const brief = await collectBrief()
      console.log()
      const metadata = await createMetadata('greenfield')
      printHeader(metadata.project, metadata.version)
      printStatus(metadata)

      console.log(`  ${bold('The agents will now scaffold your project step by step:')}\n`)
      console.log(`  ${cyan('Phase 1')} → Create project structure, CLAUDE.md, initial files`)
      console.log(`  ${cyan('Phase 2')} → Write requirements from your brief`)
      console.log(`  ${cyan('Phase 3')} → Design the architecture`)
      console.log(`  ${cyan('Phase 4')} → Implement the first features\n`)

      const go = await confirm('  Start Phase 1 (Prepare)?')
      if (go) {
        const ok = await runPhase(1, tools)
        if (ok) {
          console.log()
          const cont = await confirm('  Continue to Phase 2 (Define)?')
          if (cont) {
            const ok2 = await runPhase(2, tools)
            if (ok2) {
              console.log()
              const cont2 = await confirm('  Continue to Phase 3 (Design)?')
              if (cont2) {
                const ok3 = await runPhase(3, tools)
                if (ok3) {
                  console.log()
                  console.log(green('  ═══════════════════════════════════════'))
                  console.log(green('  ✓ Project designed! Ready to implement.'))
                  console.log(green('  ═══════════════════════════════════════'))
                  console.log()
                  const dev = await confirm('  Start implementing features?')
                  if (dev) {
                    const cr = await ask('  Which feature to build first?\n  >')
                    if (cr) await runPhase(4, tools, cr)
                  }
                }
              }
            }
          }
        }
      }
    } else {
      // ── Existing code ──
      if (!state.hasCode) {
        console.log()
        console.log(yellow('  ⚠ No source code found in this folder.'))
        console.log(`  ${gray('Add your source code first, or choose option 1 to build from scratch.')}\n`)
        return
      }
      console.log()
      const metadata = await createMetadata('existing')
      printHeader(metadata.project, metadata.version)
      printStatus(metadata)

      const go = await confirm('  Start Phase 1 (Prepare)?')
      if (go) {
        const ok = await runPhase(1, tools)
        if (ok) {
          console.log()
          const cont = await confirm('  Continue to Phase 2 (Define)?')
          if (cont) {
            const ok2 = await runPhase(2, tools)
            if (ok2) {
              console.log()
              const cont2 = await confirm('  Continue to Phase 3 (Design)?')
              if (cont2) {
                const ok3 = await runPhase(3, tools)
                if (ok3) {
                  console.log()
                  console.log(green('  ═════════════════════════════════════'))
                  console.log(green('  ✓ Setup complete! Ready to develop.'))
                  console.log(green('  ═════════════════════════════════════'))
                  console.log()
                  const dev = await confirm('  Develop a feature now?', false)
                  if (dev) {
                    const cr = await ask('  Describe your change request:\n  >')
                    if (cr) await runPhase(4, tools, cr)
                  }
                }
              }
            }
          }
        }
      }
    }
    return
  }

  // ── Returning: metadata exists ──
  const metadata = loadMetadata()
  printHeader(metadata.project, metadata.version)
  const nextPending = printStatus(metadata)

  // Figure out the situation
  const setupDone = metadata.phases.prepare === 'completed'
    && metadata.phases.define === 'completed'
    && metadata.phases.design === 'completed'
  const developDone = metadata.phases.develop === 'completed'

  // ── All setup phases done: main menu ──
  if (setupDone) {
    console.log(bold('  What would you like to do?'))
    console.log(`  1. ${cyan('Develop a new feature')}`)
    if (nextPending && nextPending !== 4) {
      const nextPhase = PHASES[nextPending - 1]
      console.log(`  2. Continue to Phase ${nextPending} (${nextPhase.name})`)
      console.log(`  3. Pick a specific phase`)
    } else {
      console.log(`  2. Pick a specific phase`)
    }
    console.log()

    const choice = await ask('  >', '1')

    if (choice === '1') {
      // Develop loop
      let developing = true
      while (developing) {
        const cr = await ask('  Describe your change request:\n  >')
        if (!cr) {
          console.log(`  ${yellow('!')} No change request. Exiting.`)
          return
        }
        await runPhase(4, tools, cr)
        console.log()
        developing = await confirm('  Develop another feature?', false)
      }
    } else if (choice === '2' && nextPending && nextPending !== 4) {
      await runPhase(nextPending, tools)
    } else {
      const phaseInput = await ask('  Which phase? (1-7)')
      const num = parseInt(phaseInput, 10)
      if (num >= 1 && num <= 7) {
        const phase = PHASES[num - 1]
        if (metadata.phases[phase.key] === 'completed' && !phase.repeatable) {
          console.log(yellow(`  ⚠ Phase ${num} (${phase.name}) is already completed.`))
          const redo = await confirm('  Re-run anyway?', false)
          if (!redo) return
        }
        if (num === 4) {
          const cr = await ask('  Describe your change request:\n  >')
          if (!cr) return
          await runPhase(num, tools, cr)
        } else {
          await runPhase(num, tools)
        }
      }
    }
    return
  }

  // ── Mid-setup: guide through remaining setup phases ──
  if (nextPending && nextPending <= 3) {
    const phase = PHASES[nextPending - 1]
    console.log(`  ${bold('Setup in progress.')} Next: Phase ${nextPending} (${phase.name})`)
    console.log(`  ${dim(phase.desc)}\n`)

    const go = await confirm(`  Run Phase ${nextPending} (${phase.name})?`)
    if (!go) return

    const ok = await runPhase(nextPending, tools)

    // After each setup phase, offer to continue
    if (ok && nextPending < 3) {
      for (let next = nextPending + 1; next <= 3; next++) {
        console.log()
        const nextPhase = PHASES[next - 1]
        const cont = await confirm(`  Continue to Phase ${next} (${nextPhase.name})?`)
        if (!cont) break
        const ok2 = await runPhase(next, tools)
        if (!ok2) break
      }
    }

    // If we just finished phase 3, celebrate
    const updated = loadMetadata()
    if (updated && updated.phases.design === 'completed') {
      console.log()
      console.log(green('  ═══════════════════════════════════'))
      console.log(green('  ✓ Setup complete! Ready to develop.'))
      console.log(green('  ═══════════════════════════════════'))
      console.log()
      const dev = await confirm('  Develop a feature now?', false)
      if (dev) {
        const cr = await ask('  Describe your change request:\n  >')
        if (cr) await runPhase(4, tools, cr)
      }
    }
    return
  }

  // ── Fallback: pick a phase ──
  const phaseInput = await ask('  Which phase?', nextPending?.toString())
  const num = parseInt(phaseInput, 10)
  if (num >= 1 && num <= 7) {
    if (num === 4) {
      const cr = await ask('  Describe your change request:\n  >')
      if (cr) await runPhase(num, tools, cr)
    } else {
      await runPhase(num, tools)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
