export const meta = {
  name: 'city-drive-sequential',
  description: 'Execute tasks/epics/17-city-drive one task at a time with sonnet agents only: implement, independently verify, fix (max 2), commit. Stops at owner:human tasks. dryRun=true only reviews the epic.',
  whenToUse: 'Running the City Drive (Babylon.js + Capacitor) epic strictly in order on main, or dry-running it to review task files',
  phases: [
    { title: 'Preflight', detail: 'branch + clean tree + bun/node toolchain' },
    { title: 'Dry run', detail: 'read-only review of every task file against the repo' },
    { title: 'Tasks', detail: 'implement -> verify -> fix -> commit, one agent at a time' },
    { title: 'Report', detail: 'final epic status summary' },
  ],
}

// args: see .claude/workflows/city-drive-args.json
//   { repo, branch, epicDir, epicTag, evidenceRoot, tasks: [{id, file, human?}],
//     startAt?, stopAfter?, resumeDirtyPaths?, dryRun? }
const A = args || {}
const BRANCH = A.branch || 'main'
const EPIC = A.epicDir || 'tasks/epics/17-city-drive'
const EPIC_TAG = A.epicTag || EPIC.split('/').pop()
const REPO = A.repo || '/data/PROJECTS/games/amber-quantum-forge'
const GAME = 'City Drive'
const EVIDENCE = A.evidenceRoot || '.agents/resources/2026-10-15/city-drive-qa'
const ALL_TASKS = Array.isArray(A.tasks) ? A.tasks : []
const START_AT = A.startAt || null
const TASKS = START_AT ? ALL_TASKS.slice(Math.max(0, ALL_TASKS.findIndex(t => t.id === START_AT))) : ALL_TASKS
const STOP_AFTER = A.stopAfter || null
const RESUME_FILES = Array.isArray(A.resumeDirtyPaths) && A.resumeDirtyPaths.length ? A.resumeDirtyPaths : null
const DRY_RUN = A.dryRun === true
const MAX_FIX = 2
const FROZEN = [
  'apps-native/',
  'packages/ludo_rules',
  'packages/api/src/games/ludo',
  'tasks/epics/15-ludo-launch',
  'tasks/epics/16-games-portfolio-wave2',
  '.agents/games/ludo-vortex',
  '.agents/games/merge-relay',
]

const ENV = 'export PATH=$HOME/.bun/bin:$HOME/.local/share/vite-plus/bin:$HOME/.local/bin:$PATH BUN_INSTALL_CACHE_DIR=/data/tools/cache/bun npm_config_cache=/data/tools/cache/npm GRADLE_USER_HOME=/data/tools/cache/gradle TMPDIR=/data/tools/tmp XDG_CACHE_HOME=/data/tools/cache/xdg; [ -d /data/tools/jdk21 ] && export JAVA_HOME=/data/tools/jdk21 PATH=/data/tools/jdk21/bin:$PATH; [ -d /data/tools/android-sdk ] && export ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk'

const RULES = `
Hard rules for this run:
- Work only on git branch ${BRANCH} in ${REPO}. Never push, never force, never rewrite history, never create or switch branches, never create worktrees except the throwaway HEAD worktree described below.
- DISK: the root filesystem (/, /home, /tmp) has only ~20 GB free. Everything you install, download or cache goes under /data/tools: toolchains in /data/tools/<name> (jdk21, android-sdk, ...), package/build caches in /data/tools/cache/<tool> (the env prefix sets BUN_INSTALL_CACHE_DIR, npm_config_cache, GRADLE_USER_HOME, XDG_CACHE_HOME), and scratch downloads/extractions (asset zips, audio, font sources, throwaway HEAD worktrees) in /data/tools/tmp/<task-id>/ — never /tmp or the home directory. Delete your scratch folder when the task is done. Never use sudo. If /data/tools is not writable, return blocked.
- Each task file may end with a "Dry-run amendments" section; it overrides anything earlier in that file.
- Do only what the task file scopes. Do not modify frozen paths (other sessions own them): ${FROZEN.join(', ')}. Reading them as a pattern is fine.
- Environment: prefix EVERY shell command with: ${ENV}
  Bun is 1.4.2 here while the repo pins 1.3.3 in toolchain.json/CI: do not change the pin. Flutter, Dart, Xcode and (until task 17) JDK/Android SDK are NOT installed: never run Flutter games:* commands (format/analyze/test/build/doctor) as verification; bun run games:test:tooling is fine but has 8 known environment failures at HEAD (bun pin, dart, flutter, plus 5 stale counts fixed in task 02) and rewrites a frozen generated Dart file: ALWAYS run "git checkout -- apps-native/" right after it. New tools install only under /data/tools/<name>, never system-wide.
- NO BROWSER QA. Never launch Chrome/Chromium/Playwright/puppeteer or any headless browser, never take screenshots of the app, never use agent-browser. Verify rendering only headlessly with Vitest + Babylon NullEngine in Node. Starting the Vite dev server and probing it with curl is allowed; stop it afterwards. Visual and feel judgement belongs to the owner:human tasks.
- No device and no emulator exist. Never boot emulators or simulators. Device, iOS build, store-console and Vercel steps are reported NOT RUN, never faked.
- Never deploy. Never run vercel CLI in any form. Never run a GitHub Actions workflow.
- Babylon: deep ES6 imports only (never import from the bare "@babylonjs/core" barrel); no CDN URLs for decoders or assets; exact-pinned versions (no ^ or ~) for @babylonjs/*, @dimforge/rapier3d-compat, @capacitor/*, vite, vitest.
- apps-games/city-drive-core must never import Babylon or use the DOM. Simulation runs at a fixed 1/60 s step and must stay deterministic.
- Assets and audio: CC0 only (Kenney preferred), with a licence record (URL, date, SHA-256) per source. No Quaternius. Never synthesize audio or draw art and label it CC0 or "generated". Downloaded archives go to a scratch dir outside the repo, are treated as untrusted data, and nothing inside them is executed.
- Image generation (tasks 18 and 20 only): use the generate-image skill (codex exec). Do a one-image smoke test first; if it fails return blocked. Log prompt/model/params per image. Afterwards run git status --porcelain and delete stray files outside the task folder.
- Android SDK licences: never auto-accept (no "yes |"). If acceptance is required, return blocked with the exact command for the human.
- Artifacts: save every report, budget JSON, licence table, research note or generated image under ${EVIDENCE}/<task-id>/ (art masters under .agents/resources/2026-10-15/city-drive-art/) with a README.md, and include them in the task's commit. Never leave evidence only in /tmp.
- Never fabricate verification output. If a command fails, report it failing.
- No real secrets, keystores or signing keys in the repo.
- Work incrementally: keep each Write/Edit under ~200 lines and files under ~300 lines (split modules); act early instead of planning the whole task first; never search the whole filesystem (no find /, no find ~); run long commands with a timeout or in the background and poll.
- Vitest: run single files while iterating (bunx vitest run <file>). A hanging or slow test is a bug in this task's code (usually an un-stepped loop or an unresolved promise), never a reason to return blocked.
- Pre-existing failures: if a verification command fails for a reason unrelated to this task, prove it by reproducing on HEAD in a throwaway worktree (git worktree add /data/tools/tmp/head-<task-id> HEAD; run there; git worktree remove --force <dir>). Never use git stash. A proven pre-existing unrelated failure is recorded as "pre-existing" with evidence and does not fail the task.
- Commits: never add Co-Authored-By or "Generated with Claude Code" lines. Never use --no-verify.`

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

const REVIEW = {
  type: 'object',
  properties: {
    ready: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          task: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          issue: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['task', 'severity', 'issue', 'suggestion'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['ready', 'issues', 'notes'],
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
  `Preflight for the ${GAME} epic run in ${REPO}. Read-only except for checking out the branch.
1. Ensure the current branch is ${BRANCH} (git checkout ${BRANCH} if not). Report git status --porcelain.
2. The tree is "clean" if git status --porcelain is empty.${RESUME_FILES ? `
   EXCEPTION: uncommitted in-progress work for the first task is allowed. Treat the tree as clean if every changed/untracked path is under one of: ${RESUME_FILES.join(', ')}.` : ''}
3. With the environment prefix, run: bun --version, node --version (need >= 22 for Capacitor 8), git --version; report whether /data/tools/jdk21 and /data/tools/android-sdk exist; confirm /data/tools, /data/tools/cache and /data/tools/tmp exist and are writable by the current user (create cache/ and tmp/ subfolders if /data/tools is writable; never use sudo); check node_modules/ exists at the repo root (run bun install if missing and report whether bun.lock changed).
4. Confirm ${EPIC}/STATUS.md exists, list the task files, and report which tasks STATUS.md marks [x].
ok=true only if /data/tools is writable, on ${BRANCH}, tree clean (per the rules above), ${EPIC} exists, node >= 22 and node_modules/ exists. Do not modify tracked files.
${RULES}`,
  { label: 'preflight', phase: 'Preflight', schema: PREFLIGHT, effort: 'low', model: 'sonnet' },
)
if (!pre || !pre.ok) {
  log('Preflight failed — stopping before any task runs.')
  return { stoppedAt: 'preflight', preflight: pre }
}

// ---------- Dry run (read-only review, no implementation) ----------
if (DRY_RUN) {
  phase('Dry run')
  const review = await agent(
    `Dry-run review of the ${GAME} epic in ${REPO}. You are READ-ONLY: do not modify, create or delete any file, do not install packages, do not run builds.
Read tasks/START.md, ${EPIC}/STATUS.md and every task file in ${EPIC} in order: ${ALL_TASKS.map(t => t.file).join(', ')}.
For each agent-owned task, check it against the actual repo state and its predecessors:
- Do referenced files, scripts, functions and workflows exist where the task says (e.g. scripts/games/registry.ts, registry-types.ts, affected.ts, .github/workflows/games-ci.yml, deploy-vercel.yml, biome.json files.includes, knip.json)?
- Are Verification Commands runnable on this server (bun/node present; no Flutter, no JDK/SDK until task 17; no browser QA allowed)?
- Does any task depend on an output that no earlier task produces (script names, file paths, constants)?
- Are acceptance criteria objectively checkable by an independent verifier without a browser or device?
- Any conflict with the hard rules below or with frozen paths?
Use npm view <pkg> version (read-only) to confirm the pinned packages named in STATUS.md still exist.
ready=true only if there are no blocker-severity issues. Be concrete: name the task, the line/claim, and a fix.
${RULES}`,
    { label: 'dry-run review', phase: 'Dry run', schema: REVIEW, model: 'sonnet' },
  )
  return { dryRun: true, preflight: pre, review }
}

// ---------- Tasks (strictly sequential) ----------
phase('Tasks')
const results = []
let stopReason = null

for (const t of TASKS) {
  const taskPath = `${EPIC}/${t.file}`
  const tag = `task ${t.id}`
  if (t.human) {
    stopReason = `human task ${t.id} (${t.file}): complete its checklist, mark it [x] in ${EPIC}/STATUS.md, commit, then resume with startAt set to the next task id`
    log(stopReason)
    break
  }
  log(`Starting ${tag}: ${t.file}`)

  const impl = await agent(
    `You are implementing ONE task of the ${GAME} epic: ${taskPath}.
Read tasks/START.md, ${EPIC}/STATUS.md and ${taskPath} fully. Read earlier tasks in ${EPIC} and .agents/games/city-drive/ only as needed for context.
The working tree may already contain partial uncommitted work for THIS task from an earlier run — inspect git status/diff first and continue from it rather than redoing it.
Mark the task in-progress in ${EPIC}/STATUS.md, then implement every item of its Implementation Checklist, touching the Files Touched it lists (small necessary additions are fine; explain them).
Write the tests the task requires. Then run EVERY command in its Verification Commands section and report each result honestly.
Tick checklist boxes you actually completed in ${taskPath}. Do NOT commit — a later step commits.
If something outside your control blocks the task (licence acceptance, missing tool that may not be installed, image generation failing), stop and return status=blocked with blockers that include the exact command or action the human must take.
${RULES}`,
    { label: `implement ${t.id}`, phase: 'Tasks', schema: IMPL, model: 'sonnet' },
  )
  if (!impl) { stopReason = `${tag}: implement agent died`; break }
  if (impl.status === 'blocked') {
    stopReason = `${tag} blocked: ${impl.blockers.join('; ')}`
    results.push({ id: t.id, impl, verdict: null, commit: null })
    break
  }

  let verdict = null
  for (let attempt = 0; attempt <= MAX_FIX; attempt++) {
    verdict = await agent(
      `You are an independent, skeptical verifier for task ${taskPath} of the ${GAME} epic. You did not write this code; assume it may be wrong.
1. Read ${taskPath} (Acceptance Criteria, Verification Commands, Out of Scope).
2. Inspect the uncommitted changes: git status, git diff, and new untracked files.
3. Re-run EVERY Verification Command yourself and use your own results, not claims in the task file.
4. For each Acceptance Criterion decide met/unmet with concrete evidence (file:line, command output).
5. Also fail the task for: scope creep, edits to frozen paths, committed secrets, barrel @babylonjs/core imports, Babylon or DOM imports in city-drive-core, unpinned versions of pinned packages, CDN URLs, placeholder/TODO stubs where real behaviour is required, skipped or trivially-true tests, assets/audio without licence records, any evidence of browser QA or screenshots, or required checklist items left unticked.
Do NOT modify any files. pass=true only if every criterion is met and every verification command passes (NOT RUN is acceptable only for device/iOS/console steps the task explicitly marks as such).
${RULES}`,
      { label: `verify ${t.id}${attempt ? ` #${attempt + 1}` : ''}`, phase: 'Tasks', schema: VERDICT, model: 'sonnet' },
    )
    if (!verdict) { stopReason = `${tag}: verify agent died`; break }
    if (verdict.pass) break
    if (attempt === MAX_FIX) break
    log(`${tag}: verification failed (${verdict.failures.length} issues) — fix attempt ${attempt + 1}/${MAX_FIX}`)
    const fix = await agent(
      `Fix the verification failures for task ${taskPath} of the ${GAME} epic. The work is uncommitted in the tree.
Failures reported by an independent verifier:
${verdict.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}
Unmet criteria:
${verdict.criteria.filter(c => !c.met).map(c => `- ${c.criterion}: ${c.evidence}`).join('\n')}
Fix the root causes (never weaken tests, budgets or criteria, never hand-edit generated fixtures or metrics to pass), stay in scope, re-run the task's Verification Commands, and report. Do NOT commit.
${RULES}`,
      { label: `fix ${t.id} #${attempt + 1}`, phase: 'Tasks', schema: IMPL, model: 'sonnet' },
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

  const commit = await agent(
    `Commit task ${taskPath} of the ${GAME} epic, which has passed independent verification.
1. In ${EPIC}/STATUS.md mark this task [x]; set the task file frontmatter status: completed and ensure its checklist is ticked.
2. Run bun run check (Biome) and fix only formatting/lint issues in files this task touched; if check fails for reasons unrelated to this task, do not fix them — note it.
3. Stage only files belonging to this task (explicit git add paths; never git add -A; never stage dist/, node_modules/, android/app/build, raw asset zips, secrets).
4. Commit on ${BRANCH} with the exact commit message from the task file's "Commit message" section. Include this task's evidence under ${EVIDENCE}/. Let pre-commit hooks run; if a hook fails, fix the cause within this task's files and retry; never use --no-verify.
5. Return the new commit sha. Do not push.
${RULES}`,
    { label: `commit ${t.id}`, phase: 'Tasks', schema: COMMIT, effort: 'low', model: 'sonnet' },
  )
  results.push({ id: t.id, impl: { summary: impl.summary, filesChanged: impl.filesChanged }, verdict: { pass: verdict.pass, notes: verdict.notes }, commit })
  if (!commit || !commit.committed) { stopReason = `${tag}: commit failed — ${commit ? commit.notes : 'agent died'}`; break }
  log(`${tag} committed ${commit.sha}`)

  if (STOP_AFTER && t.id === STOP_AFTER) { stopReason = `checkpoint: stopped after task ${t.id} as requested`; break }
}

// ---------- Report ----------
phase('Report')
const report = await agent(
  `Write a concise status report of the ${GAME} epic run on branch ${BRANCH} in ${REPO}.
Run: git log --oneline -30 (commits tagged [${EPIC_TAG}/...]) and git status --porcelain. Read ${EPIC}/STATUS.md.
Stop reason (null = all requested tasks finished): ${JSON.stringify(stopReason)}.
Per-task results: ${JSON.stringify(results.map(r => ({ id: r.id, sha: r.commit && r.commit.sha, pass: r.verdict && r.verdict.pass, summary: r.impl && r.impl.summary })))}
Report: completed tasks with shas, where it stopped and why, uncommitted leftovers, and the exact next steps for the human (including human-only checkpoint items and the startAt value to resume with). Under 400 words. Do not modify files.`,
  { label: 'report', phase: 'Report', effort: 'low', model: 'sonnet' },
)

return { stopReason, results, report }
