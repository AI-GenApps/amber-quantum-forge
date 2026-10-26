export const meta = {
  name: 'ludo-economy-release-sequential',
  description: 'Finish Ludo epic 15 tasks 26g, 26h, 26i, 27, 28 with NO device: one sonnet agent at a time implements, verifies and commits each task',
  whenToUse: 'Run first. Device evidence for 26g/26h is collected afterwards by ludo-economy-device-pass. Skips human task 26f and stops before human task 29',
  phases: [
    { title: 'Preflight', detail: 'branch, clean tree, toolchain', model: 'sonnet' },
    { title: 'Tasks', detail: 'implement -> verify -> fix (max 2) -> commit, one sonnet agent at a time', model: 'sonnet' },
    { title: 'Report', detail: 'final status summary', model: 'sonnet' },
  ],
}

// args: { branch?, epicDir?, tasks: [{ id, file, deviceFlow?: boolean }], stopAfter?, note? }
// deviceFlow=true: the implementer must also write a device-flow.md that the later device workflow executes.
const A = args || {}
const BRANCH = A.branch || 'main'
const EPIC = A.epicDir || 'tasks/epics/15-ludo-launch'
const TASKS = Array.isArray(A.tasks) ? A.tasks : []
const STOP_AFTER = A.stopAfter || null
const MAX_FIX = 2
const S = { model: 'sonnet' }
const EVIDENCE = '.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence'
const NOTE = A.note ? `\nOrchestrator note for this run: ${A.note}\n` : ''

const RULES = `
Hard rules for this run:
- Toolchain: flutter and dart are NOT on the default PATH. Start every shell command that uses them with: export PATH="$HOME/flutter/bin:$PATH" (Flutter 3.47.3 / Dart 3.13.3 live in ~/flutter). bun 1.4.2 vs the expected 1.3.3 is only a warning from "bun run games:doctor" (exit 0) and is not a failure.
- Work only on git branch ${BRANCH} in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Never push, never force, never rewrite history, never create or switch branches, never use git stash.
- Do only what the task file scopes. Do not modify apps-native/unity/ludo (frozen).
- NO DEVICE IN THIS RUN: never run adb, "games:run", "flutter run", "flutter install", or anything that installs, launches or drives a phone or emulator, and never boot emulators/simulators. On-device evidence (a task's "Capture device evidence" item and its games:run command) is collected later by a separate device workflow driven by haiku agents; treat those as "NOT RUN (deferred to device workflow)", which never fails a task. Building (flutter build apk, games:build) is allowed.
- Task 26f (economy art session, human-interactive) is SKIPPED by the user's decision of 2026-10-16 and stays unticked in ${EPIC}/STATUS.md; its dependency is waived. Wherever a task would use 26f art (dice/token/board themes, currency icons, store banners) use code-drawn fallbacks in the existing manifest slots and document which slots await 26f art. Never generate bitmap art with image-gen and never copy competitor art.
- Never fabricate verification output. If a command fails, report it failing.
- No real secrets in the repo; use fakes, test IDs and in-memory adapters when credentials are absent. AdMob: debug builds use Google's test ad unit IDs only. RevenueCat/AdMob/Firebase console steps are NOT RUN, never faked. RevenueCat keys absent must be a graceful no-op.
- Backend changes: also run the repo-root "bun run typecheck" (all workspaces). apps/web type-checks packages/api with an es5 target, so spreading or iterating Set/Map/iterators fails there (use Array.from).
- Databases: NEVER run migrations, db:push, db:migrate, seeds, or tests against DATABASE_URL (or any URL) from .env / .env.local. Only generate migration files (bun run db:generate). Postgres integration tests stay gated behind a dedicated test-only env var and are reported NOT RUN (skipped) when unset; that does not fail a task.
- Atomic caps: every daily cap or one-time grant in the economy store must use an atomic check-and-write (the pattern of recordXpClaimWithCap, commit f755ac1) with a concurrency test that fires simultaneous claims, never read-then-write.
- Work incrementally: keep each Write/Edit call under ~200 lines, act early, never search the whole filesystem, run long commands (flutter test, builds) with a timeout or in the background and poll.
- Flutter tests: a healthy ludo suite finishes well under 3 minutes. Use "flutter test --timeout 60s <file>" while iterating from apps-native/games/ludo. A hanging test is a bug (usually pumpAndSettle on a repeating animation or an unresolved timer), never a reason to return blocked.
- Pre-existing failures: prove them by reproducing the same failure on HEAD in a throwaway git worktree (git worktree add <scratch dir> HEAD, run, git worktree remove --force). A proven pre-existing unrelated failure is recorded as "pre-existing" and does not fail the task.
- Artifacts go under .agents/resources/ (never only /tmp). Update the Ludo game knowledge base under .agents/games/ (ls it to find the Ludo folder) whenever the task makes a product or technical decision.
- Do not delegate to other agents.`

const PREFLIGHT = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, branch: { type: 'string' }, clean: { type: 'boolean' }, notes: { type: 'string' } },
  required: ['ok', 'branch', 'clean', 'notes'],
}

const IMPL = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    verification: {
      type: 'array',
      items: {
        type: 'object',
        properties: { command: { type: 'string' }, result: { type: 'string', enum: ['pass', 'fail', 'not_run'] }, note: { type: 'string' } },
        required: ['command', 'result'],
      },
    },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'summary', 'filesChanged', 'verification', 'blockers'],
}

const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    failures: { type: 'array', items: { type: 'string' } },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: { criterion: { type: 'string' }, met: { type: 'boolean' }, evidence: { type: 'string' } },
        required: ['criterion', 'met', 'evidence'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['pass', 'failures', 'criteria', 'notes'],
}

const COMMIT = {
  type: 'object',
  properties: { committed: { type: 'boolean' }, sha: { type: 'string' }, message: { type: 'string' }, notes: { type: 'string' } },
  required: ['committed', 'sha', 'message', 'notes'],
}

// ---------- Preflight ----------
phase('Preflight')
const pre = await agent(
  `Preflight for the Ludo epic run in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Read-only except for checking out the branch.
1. Ensure the current branch is ${BRANCH} (git checkout ${BRANCH} if not). Report git status --porcelain; the tree is clean if it is empty OR every entry is an untracked file under .claude/workflows/ (the workflow scripts themselves — ignore those; never stage or commit them).
2. Run: export PATH="$HOME/flutter/bin:$PATH" first, then flutter --version, dart --version, bun --version, bun run games:doctor. Summarize (do NOT run adb or any device command). A bun version MISMATCH line is only a warning; ok stays true if flutter, dart and doctor's exit code are fine.
3. Confirm ${EPIC}/STATUS.md exists, that tasks 26e and earlier are ticked there, and that each of these task files exists: ${TASKS.map(t => t.file).join(', ')}.
ok=true only if on ${BRANCH}, tree clean (per the rule above), flutter/dart work after the PATH export, and the epic folder and task files exist.`,
  { ...S, label: 'preflight', phase: 'Preflight', schema: PREFLIGHT, effort: 'low' },
)
if (!pre || !pre.ok) {
  log('Preflight failed — stopping before any task runs.')
  return { stoppedAt: 'preflight', preflight: pre }
}

// ---------- Tasks (strictly sequential) ----------
phase('Tasks')
const results = []
let stopReason = null

for (const t of TASKS) {
  const taskPath = `${EPIC}/${t.file}`
  const tag = `task ${t.id}`
  log(`Starting ${tag}: ${t.file}`)

  const flowFile = `${EVIDENCE}/${t.id}/device-flow.md`
  const flowInstr = t.deviceFlow
    ? `Also write ${flowFile}: a precise, numbered on-device flow for a haiku agent that will run it later on a 1080x2400 Android phone (debug app app.w3dev.ludo.debug): launch state needed, screen names, visible labels or content descriptions, tap order, expected result per step, test-ad behavior, and which screens to screenshot. Never include steps that complete a real-money purchase. It is committed with the task.`
    : 'This task has no device flow.'

  // 1) implement
  const impl = await agent(
    `You are implementing ONE task of the Ludo launch epic: ${taskPath}.
Read tasks/START.md, ${EPIC}/STATUS.md, and ${taskPath} fully. Read earlier completed tasks in ${EPIC} only as needed (26a-26e define the economy, wallet and HUD you build on).
${NOTE}The working tree may already contain partial or complete uncommitted work for THIS task from an earlier run — inspect git status/diff first and continue from it.
Mark the task in-progress in ${EPIC}/STATUS.md, then implement every item of its Implementation Checklist, touching the Files Touched it lists (small necessary additions are fine; explain them).
Write/extend the tests the task requires, then run EVERY non-device command in the task's Verification Commands and report each result honestly. Leave the device-evidence checklist item unticked.
${flowInstr}
Do NOT commit. If something outside your control blocks the task, return status=blocked with blockers.
${RULES}`,
    { ...S, label: `implement ${t.id}`, phase: 'Tasks', schema: IMPL },
  )
  if (!impl) { stopReason = `${tag}: implement agent died`; break }
  if (impl.status === 'blocked') {
    stopReason = `${tag} blocked: ${impl.blockers.join('; ')}`
    results.push({ id: t.id, impl, verdict: null, commit: null })
    break
  }

  // 2) verify (independent) + fix loop
  let verdict = null
  for (let attempt = 0; attempt <= MAX_FIX; attempt++) {
    verdict = await agent(
      `${NOTE}You are an independent, skeptical verifier for task ${taskPath} of the Ludo epic. You did not write this code; assume it may be wrong.
1. Read ${taskPath} (Acceptance Criteria, Verification Commands, Out of Scope).
2. Inspect the uncommitted changes: git status, git diff, and new untracked files.
3. Re-run EVERY non-device Verification Command yourself and use your own results, not claims in the task file.
4. For each Acceptance Criterion decide met/unmet with concrete evidence (file:line, command output). The device-evidence criterion and the games:run command are "NOT RUN (deferred to device workflow)" and do not fail the task; every other criterion must pass.
${t.deviceFlow ? `5. ${flowFile} must exist and be a concrete, executable, numbered flow; a vague or missing flow fails the task.` : ''}
6. Also fail for: scope creep, edits to apps-native/unity/ludo, committed secrets, TODO stubs where real behavior is required, skipped or trivially-true tests, read-then-write caps where an atomic check-and-write is required, real (non-test) AdMob unit IDs reachable from debug builds, any adb/device use, or bitmap art generated or copied contrary to the 26f waiver.
Do NOT modify files. pass=true only if every criterion is met and every non-device command passes.
${RULES}`,
      { ...S, label: `verify ${t.id}${attempt ? ` #${attempt + 1}` : ''}`, phase: 'Tasks', schema: VERDICT },
    )
    if (!verdict) { stopReason = `${tag}: verify agent died`; break }
    if (verdict.pass) break
    if (attempt === MAX_FIX) break
    log(`${tag}: verification failed (${verdict.failures.length} issues) — fix attempt ${attempt + 1}/${MAX_FIX}`)
    const fix = await agent(
      `Fix the verification failures for task ${taskPath} of the Ludo epic. The work is uncommitted in the tree.
Failures reported by an independent verifier:
${verdict.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}
Unmet criteria:
${verdict.criteria.filter(c => !c.met).map(c => `- ${c.criterion}: ${c.evidence}`).join('\n')}
Fix the root causes (do not weaken tests or criteria), stay in scope, re-run the affected non-device Verification Commands, and report. Do NOT commit.
${RULES}`,
      { ...S, label: `fix ${t.id} #${attempt + 1}`, phase: 'Tasks', schema: IMPL },
    )
    if (!fix) { stopReason = `${tag}: fix agent died`; break }
    if (fix.status === 'blocked') { stopReason = `${tag} blocked during fix: ${fix.blockers.join('; ')}`; break }
  }
  if (stopReason) { results.push({ id: t.id, impl, verdict, commit: null }); break }
  if (!verdict.pass) {
    stopReason = `${tag} failed verification after ${MAX_FIX} fix attempts`
    results.push({ id: t.id, impl, verdict, commit: null })
    break
  }

  // 3) commit
  const commit = await agent(
    `Commit task ${taskPath} of the Ludo epic, which has passed independent verification.
1. In ${EPIC}/STATUS.md mark this task [x]; tick the task file's completed checklist items. Leave the device-evidence item unticked and add a one-line note in the task file: "device evidence pending: run ludo-economy-device-pass". Leave 26f unticked.
2. Run bun run check (Biome) and fix only formatting/lint issues in files this task touched; unrelated failures are noted, not fixed.
3. Stage only files belonging to this task with explicit paths (never git add -A; never stage build outputs, .dart_tool or secrets)${t.deviceFlow ? `, including ${flowFile}` : ''}.
4. Commit on ${BRANCH} with the exact commit message given in the task file's "Commit message" section. Let pre-commit hooks run; if one fails, fix the cause within this task's files and retry once; never use --no-verify.
5. Return the new commit sha. Do not push.
${RULES}`,
    { ...S, label: `commit ${t.id}`, phase: 'Tasks', schema: COMMIT, effort: 'low' },
  )
  results.push({ id: t.id, impl: { summary: impl.summary, filesChanged: impl.filesChanged }, verdict: { pass: verdict.pass, notes: verdict.notes }, commit })
  if (!commit || !commit.committed) { stopReason = `${tag}: commit failed — ${commit ? commit.notes : 'agent died'}`; break }
  log(`${tag} committed ${commit.sha}`)

  if (STOP_AFTER && t.id === STOP_AFTER) { stopReason = `checkpoint: stopped after task ${t.id} as requested`; break }
}

// ---------- Report ----------
phase('Report')
const report = await agent(
  `Write a concise status report of the Ludo epic run on branch ${BRANCH}.
Run: git log --oneline -15 (commits tagged [15-ludo-launch/...]) and git status --porcelain. Read ${EPIC}/STATUS.md.
Stop reason (null = all requested tasks finished): ${JSON.stringify(stopReason)}.
Per-task results: ${JSON.stringify(results.map(r => ({ id: r.id, sha: r.commit && r.commit.sha, pass: r.verdict && r.verdict.pass, summary: r.impl && r.impl.summary })))}
Report: completed tasks with shas; where it stopped and why; uncommitted leftovers; and the next steps: connect the Android phone and run the ludo-economy-device-pass workflow for tasks 26g and 26h (device flows are in ${EVIDENCE}/<task>/device-flow.md), then the human items: task 26f art session (swap fallback art for finals), task 29 acceptance/provisioning, RevenueCat/AdMob/Firebase console setup. Under 300 words. Do not modify files and do not touch any device.`,
  { ...S, label: 'report', phase: 'Report', effort: 'low' },
)

return { stopReason, results, report }
