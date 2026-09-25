export const meta = {
  name: 'games-wave2-sequential',
  description: 'Execute tasks/epics/16-games-portfolio-wave2 one task at a time with a single sonnet agent per step: implement, independently verify, fix (max 2), commit. Stops at owner:human tasks.',
  whenToUse: 'Running the games wave-2 epic (Merge Relay solo launch + portfolio fonts) on the device-less server, strictly in order',
  phases: [
    { title: 'Preflight', detail: 'branch + clean tree + toolchain', model: 'sonnet' },
    { title: 'Tasks', detail: 'implement -> verify -> fix -> commit, one agent at a time', model: 'sonnet' },
    { title: 'Report', detail: 'final epic status summary', model: 'sonnet' },
  ],
}

// Adapted from .claude/skills/audit-game-and-prepare-for-release/references/assets/sequential-epic-workflow.js
// args (see .claude/workflows/games-wave2-args.json for the full default):
//   { repo, branch: 'main', epicDir: 'tasks/epics/16-games-portfolio-wave2', epicTag: '16-games-portfolio-wave2',
//     tasks: [{ id: '00', file: '00-....md' }, { id: '17', file: '17-....md', human: true }, ...],
//     startAt?: '18',            // skip tasks before this id (resume after a human task)
//     stopAfter?: '07',          // optional extra checkpoint
//     resumeDirtyPaths?: [...] } // only when resuming partial uncommitted work
const A = args || {}
const BRANCH = A.branch || 'main'
const EPIC = A.epicDir || 'tasks/epics/16-games-portfolio-wave2'
const EPIC_TAG = A.epicTag || EPIC.split('/').pop()
const REPO = A.repo || '/home/ashutosh/PROJECTS/AI-GenApps/amber-quantum-forge'
const GAME = A.game || 'Games wave 2'
const FROZEN = Array.isArray(A.frozenDirs)
  ? A.frozenDirs
  : ['apps-native/games/ludo', 'apps-native/games/packages/ludo_rules', 'apps-native/unity/ludo', 'tasks/epics/15-ludo-launch', '.agents/games/ludo-vortex']
const VISUAL = A.visualTarget ||
  'Merge Relay: read .agents/resources/2026-09-25/merge-relay-visual-reference/README.md and view its named Threes! style anchors (quality bar only; original art, never copy or trace). Before-state: .agents/resources/2026-09-25/games-portfolio-audit/renders/.'
const EVIDENCE = A.evidenceRoot || '.agents/resources/2026-09-25/games-wave2-qa'
const TRAILER = A.commitTrailer || ''
const ALL_TASKS = Array.isArray(A.tasks) ? A.tasks : []
const START_AT = A.startAt || null
const TASKS = START_AT ? ALL_TASKS.slice(Math.max(0, ALL_TASKS.findIndex(t => t.id === START_AT))) : ALL_TASKS
const STOP_AFTER = A.stopAfter || null
const RESUME_FILES = Array.isArray(A.resumeDirtyPaths) && A.resumeDirtyPaths.length ? A.resumeDirtyPaths : null
const MAX_FIX = 2
const S = { model: 'sonnet' }

const ENV = 'export PATH=/data/tools/bun/bin:/data/tools/flutter/bin:/data/tools/jdk17/bin:$PATH PUB_CACHE=/data/tools/pub-cache JAVA_HOME=/data/tools/jdk17 ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk BUN_INSTALL_CACHE_DIR=/data/tools/bun-cache GRADLE_USER_HOME=/data/tools/gradle-home'

const RULES = `
Hard rules for this run:
- Work only on git branch ${BRANCH} in ${REPO}. Never push, never force, never rewrite history, never create or switch branches.
- Do only what the task file scopes. Do not modify frozen paths (another session owns Ludo): ${FROZEN.join(', ')}. Reading them as a pattern is fine.
- Environment: prefix EVERY shell command with: ${ENV}
  Python with Pillow: /data/tools/pyenv/bin/python. Install any new tool under /data/tools/<name>, never system-wide or in the home directory. An interactive command (login, licence prompt) goes to the user's tmux session "game" only if the task says so; otherwise report it as blocked with the exact command the human must run.
- No device and no emulator exist on this server. Never boot emulators or simulators. Device steps are reported NOT RUN, never faked. Screen evidence is headless goldens rendered by flutter test at 1080x2400 (DPR 3) with the app's real fonts loaded; VIEW every golden you create or change with the Read tool. Console/provisioning steps (Play Console, Firebase, stores) are NOT RUN.
- Visual target: ${VISUAL} Judge goldens critically: Material-default styling (Roboto, indigo/purple seed, stock buttons/list tiles), flat empty bands > 25% of screen height, black/unfilled regions, overflow stripes, clipped text, tofu boxes, misaligned elements, or unreadable contrast are failures.
- Custom fonts are mandatory in every game: no rendered text may fall back to the platform default font.
- Image generation: use only the image-gen command (~/.local/bin/image-gen; run \`source ~/.zshrc\` only if it is not on PATH): \`image-gen --prompt "<prompt, reference images by absolute path>"\` (alternate: add \`--model gpt-6-astra\`). It prints the generated PNG path under ~/.codex/generated_images/; copy it into the task folder. Each image takes 1-3 min: run it in the background with a timeout of at least 600 s. Before generating, do a one-image smoke test. If no image tool works, return blocked. Never substitute code-drawn, downloaded, or stock images and present them as generated. Log the tool, model, params and prompt for every generated file.
- Audio: CC0 only, downloaded from the source page that states CC0; never synthesize audio and label it CC0.
- Artifacts: save EVERY screenshot, golden copy, mockup, contact sheet or research note you produce under ${EVIDENCE}/<task-id>/ (art masters under the task's named .agents/resources path), with a README.md, and include them in the task's commit. Never leave evidence only in /tmp.
- Never fabricate verification output. If a command fails, report it failing.
- No real secrets or keystores in the repo; use fakes/in-memory adapters when credentials are absent.
- Work incrementally to avoid stalls: keep each Write/Edit tool call under ~200 lines (split large files into several focused files or build them up with successive Edits); act early rather than planning the whole task before the first write; never search the whole filesystem (no find /, no find ~); run long commands (flutter test, builds) with a timeout or in the background and poll.
- Flutter tests: a healthy app test suite finishes in well under 3 minutes. While iterating, run single files with a per-test timeout (e.g. \`flutter test --timeout 60s test/path_test.dart\` from apps-native/games/<app>). A slow or hanging test is a BUG in this task's code or tests (typically pumpAndSettle on a Flame game loop or a repeating animation — use pump(duration); decode real images inside tester.runAsync), never a reason to return blocked. Always read the actual pass/fail output before claiming a result.
- Pre-existing failures: if a verification command fails for a reason unrelated to this task, prove it by reproducing the same failure on HEAD in a throwaway worktree (git worktree add <scratch dir> HEAD; run the command there; git worktree remove --force <dir>). Never use git stash. A proven pre-existing, unrelated failure is recorded as "pre-existing" with evidence and does NOT fail or block the task. A failure only expected because a LATER task in this epic builds the missing piece is likewise not a failure if the task file itself says so.
- Commits: never add Co-Authored-By or "Generated with Claude Code" lines.`

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
  `Preflight for the ${GAME} epic run in ${REPO}. Read-only except for checking out the branch.
1. Ensure the current branch is ${BRANCH} (git checkout ${BRANCH} if not). Report git status --porcelain.
2. The tree is "clean" if git status --porcelain is empty.${RESUME_FILES ? `
   EXCEPTION: uncommitted in-progress work for the first task is allowed. Treat the tree as clean if every changed/untracked path is under one of: ${RESUME_FILES.join(', ')}.` : ''}
3. With the environment prefix below, run: flutter --version, dart --version, bun --version (expect 1.3.3), java -version, bun run games:doctor, and check that node_modules/ exists at the repo root (pre-commit hooks need it). If it is missing, run \`bun install --frozen-lockfile --linker hoisted\` (the default isolated linker hangs on this server) and confirm bun.lock is unchanged. Summarize. games:doctor NOT RUN lines for xcodebuild/adb are expected on this server.
4. Confirm ${EPIC}/STATUS.md exists and list the task files. Report which tasks STATUS.md marks [x] already.
ok=true only if on ${BRANCH}, tree clean (per the rules above), ${EPIC} exists, and node_modules/ exists. Do not modify tracked files.
${RULES}`,
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
  if (t.human) {
    stopReason = `human task ${t.id} (${t.file}): complete its checklist, mark it [x] in ${EPIC}/STATUS.md, commit, then resume with startAt set to the next task id`
    log(stopReason)
    break
  }
  log(`Starting ${tag}: ${t.file}`)

  // 1) implement
  const impl = await agent(
    `You are implementing ONE task of the ${GAME} launch epic: ${taskPath}.
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
      `You are an independent, skeptical verifier for task ${taskPath} of the ${GAME} epic. You did not write this code; assume it may be wrong.
1. Read ${taskPath} (Acceptance Criteria, Verification Commands, Out of Scope).
2. Inspect the uncommitted changes: git status, git diff, and new untracked files.
3. Re-run EVERY Verification Command yourself and use your own results, not any claims in the task file.
4. For each Acceptance Criterion, decide met/unmet with concrete evidence (file:line, command output).
5. Also fail the task for: scope creep beyond the task, edits to frozen dirs, committed secrets, placeholder/TODO stubs where the task requires real behavior, tests that are skipped or trivially true, or unticked checklist items that the task requires.
Do NOT modify any files. pass=true only if every criterion is met and every verification command passes (NOT RUN is acceptable only for human/device steps the task explicitly marks human-only).
${RULES}`,
      { ...S, label: `verify ${t.id}${attempt ? ` #${attempt + 1}` : ''}`, phase: 'Tasks', schema: VERDICT },
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
    `Commit task ${taskPath} of the ${GAME} epic, which has passed independent verification.
1. In ${EPIC}/STATUS.md mark this task completed ([x]); ensure the task file's checklist is ticked. If this is the epic's last automated task, leave the epic in-progress (human acceptance remains).
2. Run bun run check (Biome) and fix only formatting/lint issues in files this task touched; if check fails for reasons unrelated to this task's files, do not fix them — note it.
3. Stage only files belonging to this task (git add with explicit paths; never git add -A blindly; never stage build outputs, .dart_tool, secrets).
4. Commit on ${BRANCH} with the exact commit message given in the task file (format <type>(<scope>): <summary> [${EPIC_TAG}/<NN>])${TRAILER ? `, followed by a blank line and the trailer line "${TRAILER}"` : ''}. Include this task's evidence under ${EVIDENCE}/ if any. Let pre-commit hooks run; if a hook fails, fix the cause within this task's files and retry once; never use --no-verify.
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
  `Write a concise status report of the ${GAME} epic run on branch ${BRANCH}.
Run: git log --oneline -30 (commits tagged [${EPIC_TAG}/...]), git status --porcelain. Read ${EPIC}/STATUS.md.
Stop reason (null = all requested tasks finished): ${JSON.stringify(stopReason)}.
Per-task results: ${JSON.stringify(results.map(r => ({ id: r.id, sha: r.commit && r.commit.sha, pass: r.verdict && r.verdict.pass, summary: r.impl && r.impl.summary })))}
Report: completed tasks with shas, where it stopped and why, any uncommitted leftovers, and the exact next steps for the human (including human-only acceptance/provisioning items). Under 400 words. Do not modify files.`,
  { ...S, label: 'report', phase: 'Report', effort: 'low' },
)

return { stopReason, results, report }
