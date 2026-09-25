export const meta = {
  name: 'ludo-epic-sequential',
  description: 'Execute tasks/epics/15-ludo-launch one task at a time with a single sonnet agent per step: implement, independently verify, fix (max 2), commit',
  whenToUse: 'Running the Ludo launch epic tasks strictly in order with verification gates',
  phases: [
    { title: 'Preflight', detail: 'branch + clean tree + toolchain', model: 'sonnet' },
    { title: 'Tasks', detail: 'implement -> verify -> fix -> commit, one agent at a time', model: 'sonnet' },
    { title: 'Report', detail: 'final epic status summary', model: 'sonnet' },
  ],
}

// args: { branch: 'main', epicDir: 'tasks/epics/15-ludo-launch',
//         tasks: [{ id: '00', file: '00-....md' }, ...],   // automated tasks only, in order
//         stopAfter?: '07' }                                // optional checkpoint for human review
const A = args || {}
const BRANCH = A.branch || 'main'
const EPIC = A.epicDir || 'tasks/epics/15-ludo-launch'
const TASKS = Array.isArray(A.tasks) ? A.tasks : []
const STOP_AFTER = A.stopAfter || null
const RESUME_FILES = Array.isArray(A.resumeDirtyPaths) && A.resumeDirtyPaths.length ? A.resumeDirtyPaths : null
const MAX_FIX = 2
const S = { model: 'sonnet' }

const RULES = `
Hard rules for this run:
- Work only on git branch ${BRANCH} in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Never push, never force, never rewrite history, never create or switch branches.
- Do only what the task file scopes. Do not modify apps-native/unity/ludo (frozen) except a doc note if the task says so.
- Never boot emulators/simulators. A physical Android device (adb serial RZ8R32EAB7T, Samsung A52, 1080x2400) is attached: when a task's Verification Commands include device steps, actually run them (build, adb install, launch, navigate with adb input/uiautomator, screencap) and VIEW every screenshot with the Read tool. Only if adb shows the device missing, report NOT RUN. Firebase-console steps are reported as NOT RUN, never faked.
- Visual target (user requires Ludo King quality or better, original art only — never copy/trace Ludo King assets): read .agents/resources/2026-09-24/ludo-visual-reference/README.md and view ludo-king-reference.png there, plus real Ludo King device captures in .agents/resources/2026-09-19/ludo-reference/ (especially 16-roll-settled.png for the board screen and 06-home-clear.png for the lobby/menus; study.md indexes the rest). "Before" screens: .agents/resources/2026-09-24/ludo-baseline-before-overhaul/.
- Artifacts: save EVERY screenshot or visual evidence file you produce (device captures, comparisons) under .agents/resources/2026-09-24/ludo-visual-qa/<task-id>/ with descriptive names (e.g. 12c/board-start.png), overriding any other evidence path a task file names, and include them in the task's commit. Never leave evidence only in /tmp.
- Judge on-device screenshots against it critically: Material-default styling, white/empty areas, black/unfilled regions, overflow stripes, clipped text, misaligned or off-board elements, or unreadable contrast are failures.
- Never fabricate verification output. If a command fails, report it failing.
- No real secrets in the repo; use fakes/in-memory adapters when credentials are absent.
- Work incrementally to avoid stalls: keep each Write/Edit tool call under ~200 lines (split large files into several focused files or build them up with successive Edits); act early rather than planning the whole task before the first write; never search the whole filesystem (no find /, no find ~); run long commands (flutter test, builds) with a timeout or in the background and poll.
- Flutter tests: a healthy ludo suite finishes in well under 3 minutes. While iterating, run single files with a per-test timeout (e.g. \`flutter test --timeout 60s test/path_test.dart\` from apps-native/games/ludo). A slow or hanging test is a BUG in this task's code or tests (typically pumpAndSettle on a repeating/infinite animation — use pump(duration) or disable the looping animation in tests, or unresolved timers), never a reason to return blocked. Always read the actual pass/fail output before claiming a result.
- Pre-existing failures: if a verification command fails for a reason unrelated to this task, prove it by reproducing the same failure on HEAD in a throwaway worktree (git worktree add <scratch dir> HEAD; run the command there; git worktree remove --force <dir>). Never use git stash. A proven pre-existing, unrelated failure is recorded as "pre-existing" with evidence and does NOT fail or block the task. A failure only expected because a LATER task in this epic builds the missing piece is likewise not a failure if the task file itself says so.`

const PREFLIGHT = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    branch: { type: 'string' },
    clean: { type: 'boolean' },
    notes: { type: 'string' },
  },
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
  properties: {
    committed: { type: 'boolean' },
    sha: { type: 'string' },
    message: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['committed', 'sha', 'message', 'notes'],
}

// ---------- Preflight ----------
phase('Preflight')
const pre = await agent(
  `Preflight for the Ludo epic run in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Read-only except for checking out the branch.
1. Ensure the current branch is ${BRANCH} (git checkout ${BRANCH} if not). Report git status --porcelain.
2. The tree is "clean" if git status --porcelain is empty.${RESUME_FILES ? `
   EXCEPTION: uncommitted in-progress work for the first task is allowed. Treat the tree as clean if every changed/untracked path is under one of: ${RESUME_FILES.join(', ')}.` : ''}
3. Run: flutter --version, dart --version, bun --version, bun run games:doctor. Summarize.
4. Confirm ${EPIC}/STATUS.md exists and list the task files.
ok=true only if on ${BRANCH}, tree clean (per the rules above), and ${EPIC} exists. Do not modify any files.`,
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

  // 1) implement
  const impl = await agent(
    `You are implementing ONE task of the Ludo launch epic: ${taskPath}.
Read tasks/START.md, ${EPIC}/STATUS.md, and ${taskPath} fully. Read earlier completed tasks in ${EPIC} only as needed for context.
The working tree may already contain partial or complete uncommitted work for THIS task from an earlier run — inspect git status/diff first and continue from it rather than redoing it.
Mark the task in-progress in ${EPIC}/STATUS.md, then implement every item of its Implementation Checklist, touching the Files Touched it lists (small necessary additions are fine; explain them).
Write/extend tests as the task requires. Then run EVERY command in the task's Verification Commands section and report each result honestly.
Tick checklist boxes you actually completed in ${taskPath}. Do NOT commit — a later step commits.
If something outside your control blocks the task (missing credentials, human-only step, broken toolchain), stop and return status=blocked with blockers.
${RULES}`,
    { ...S, label: `implement ${t.id}`, phase: 'Tasks', schema: IMPL },
  )
  if (!impl) { stopReason = `${tag}: implement agent died`; break }
  if (impl.status === 'blocked') {
    stopReason = `${tag} blocked: ${impl.blockers.join('; ')}`
    results.push({ id: t.id, impl, verdict: null, commit: null })
    break
  }

  // 2) verify (independent, fresh agent) + fix loop
  let verdict = null
  for (let attempt = 0; attempt <= MAX_FIX; attempt++) {
    verdict = await agent(
      `You are an independent, skeptical verifier for task ${taskPath} of the Ludo epic. You did not write this code; assume it may be wrong.
1. Read ${taskPath} (Acceptance Criteria, Verification Commands, Out of Scope).
2. Inspect the uncommitted changes: git status, git diff, and new untracked files.
3. Re-run EVERY Verification Command yourself and use your own results, not any claims in the task file.
4. For each Acceptance Criterion, decide met/unmet with concrete evidence (file:line, command output).
5. Also fail the task for: scope creep beyond the task, edits to apps-native/unity/ludo, committed secrets, placeholder/TODO stubs where the task requires real behavior, tests that are skipped or trivially true, or unticked checklist items that the task requires.
Do NOT modify any files. pass=true only if every criterion is met and every verification command passes (NOT RUN is acceptable only for human/device steps the task explicitly marks human-only).
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
Fix the root causes (do not weaken tests or criteria), stay in the task's scope, re-run the task's Verification Commands, and report. Do NOT commit.
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
1. In ${EPIC}/STATUS.md mark this task completed ([x]); ensure the task file's checklist is ticked. If this is the epic's last automated task, leave the epic in-progress (human acceptance remains).
2. Run bun run check (Biome) and fix only formatting/lint issues in files this task touched; if check fails for reasons unrelated to this task's files, do not fix them — note it.
3. Stage only files belonging to this task (git add with explicit paths; never git add -A blindly; never stage build outputs, .dart_tool, secrets).
4. Commit on ${BRANCH} with the exact commit message given in the task file (format <type>(<scope>): <summary> [15-ludo-launch/<NN>]), followed by a blank line and the trailer line "Claude-Session: https://claude.ai/code/session_01NKwBevBWJYRuWqcRegJNh3". Include this task's evidence under .agents/resources/2026-09-24/ludo-visual-qa/ if any. Let pre-commit hooks run; if a hook fails, fix the cause within this task's files and retry once; never use --no-verify.
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
Run: git log --oneline -30 (commits tagged [15-ludo-launch/...]), git status --porcelain. Read ${EPIC}/STATUS.md.
Stop reason (null = all requested tasks finished): ${JSON.stringify(stopReason)}.
Per-task results: ${JSON.stringify(results.map(r => ({ id: r.id, sha: r.commit && r.commit.sha, pass: r.verdict && r.verdict.pass, summary: r.impl && r.impl.summary })))}
Report: completed tasks with shas, where it stopped and why, any uncommitted leftovers, and the exact next steps for the human (including human-only acceptance/provisioning items). Under 400 words. Do not modify files.`,
  { ...S, label: 'report', phase: 'Report', effort: 'low' },
)

return { stopReason, results, report }
