// Render the exact agent prompt the games-wave2 workflow would send for one task stage,
// so an orchestrator session can run the epic with plain subagents (same rules, same text).
//
// usage: node .claude/workflows/games-wave2-render-prompt.mjs <taskId> <implement|verify|fix|commit> [failures.json]
//   failures.json (fix stage only): {"failures": ["..."], "criteria": [{"criterion","met","evidence"}]}
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , id, stage, failFile] = process.argv
if (!id || !stage) {
  console.error('usage: games-wave2-render-prompt.mjs <taskId> <implement|verify|fix|commit> [failures.json]')
  process.exit(1)
}
const dir = path.dirname(fileURLToPath(import.meta.url))
const args = JSON.parse(fs.readFileSync(path.join(dir, 'games-wave2-args.json'), 'utf8'))
const src = fs
  .readFileSync(path.join(dir, 'games-wave2-sequential.js'), 'utf8')
  .replace(/^export const meta/m, 'const meta')
const run = new Function('args', 'agent', 'phase', 'log', `return (async () => {${src}})()`)
const fails = failFile
  ? JSON.parse(fs.readFileSync(failFile, 'utf8'))
  : { failures: ['(see verifier report)'], criteria: [] }

let captured = null
const done = { status: 'done', summary: '', filesChanged: [], verification: [], blockers: [] }
const agent = async (prompt, opts) => {
  if (opts.label === 'preflight') return { ok: true, branch: 'main', clean: true, notes: '' }
  const current = opts.label.split(' ')[0]
  if (current === stage && captured === null) {
    captured = prompt
    throw new Error('CAPTURED')
  }
  if (current === 'verify') {
    return stage === 'fix'
      ? { pass: false, failures: fails.failures, criteria: fails.criteria || [], notes: '' }
      : { pass: true, failures: [], criteria: [], notes: '' }
  }
  if (current === 'implement' || current === 'fix') return done
  return { committed: true, sha: 'x', message: '', notes: '' }
}

const tasks = args.tasks.filter((t) => t.id === id).map((t) => ({ ...t, human: false }))
if (tasks.length === 0) {
  console.error(`unknown task id ${id}`)
  process.exit(1)
}
try {
  await run({ ...args, tasks }, agent, () => {}, () => {})
} catch (error) {
  if (error.message !== 'CAPTURED') throw error
}
if (captured === null) {
  console.error(`stage ${stage} was not reached`)
  process.exit(1)
}
process.stdout.write(captured)
