export const meta = {
  name: 'web-games-v1',
  description: 'Build the shared web-games kit (mode=kit) or a wave of full-v1 web games (mode=wave) in isolated worktrees with sonnet/haiku agents only; art comes from the MobileGamesDesigner thread through a strict review loop. Pushes branches; the orchestrator opens, reviews and merges PRs.',
  whenToUse: 'Epic 18 (web-games kit) then epics 19-24 (six web games) in two waves. Args: .claude/workflows/web-games-v1-args.json with mode and wave set.',
  phases: [
    { title: 'Preflight', detail: 'worktrees, installs, designer reachability', model: 'haiku' },
    { title: 'Kit', detail: 'epic 18 tasks: implement -> verify -> fix (max 2) -> commit', model: 'sonnet' },
    { title: 'Plan', detail: 'per game: knowledge base, design spec, epic task files', model: 'sonnet' },
    { title: 'Build', detail: 'per game tasks 01-05, one agent at a time per game', model: 'sonnet' },
    { title: 'Art', detail: 'designer thread requests + strict review, one game at a time', model: 'sonnet' },
    { title: 'Finish', detail: 'per game tasks 06-08 (art integration, Capacitor, readiness)', model: 'sonnet' },
    { title: 'Ship', detail: 'push branches (no PRs, no merges)', model: 'haiku' },
    { title: 'Report', detail: 'final summary for the orchestrator', model: 'haiku' },
  ],
}

// ---------- Config ----------
const A = args || {}
const MODE = A.mode
const REPO = A.repo
const WT_ROOT = A.worktreeRoot
const INBOX = A.artInbox
const DATE = A.date
const DESIGNER = A.designerThreadId
const SPEC_FILE = `${REPO}/.claude/workflows/web-games-v1-args.json`
const EVID = `.agents/resources/${DATE}/web-games`
const MAX_FIX = 2
const MAX_ART_ROUNDS = 4
if (MODE !== 'kit' && MODE !== 'wave') throw new Error('args.mode must be "kit" or "wave"')
if (MODE === 'wave' && !(Array.isArray(A.wave) && A.wave.length)) throw new Error('args.wave must list game slugs')

// ---------- Concurrency: at most 4 sonnet agents and 3 haiku agents at any moment ----------
function semaphore(n) {
  let active = 0
  const queue = []
  const next = () => {
    if (active >= n || !queue.length) return
    active++
    const { fn, resolve } = queue.shift()
    Promise.resolve()
      .then(fn)
      .then(resolve, () => resolve(null))
      .finally(() => { active--; next() })
  }
  return fn => new Promise(resolve => { queue.push({ fn, resolve }); next() })
}
const sonnetSlot = semaphore(4)
const haikuSlot = semaphore(3)
const designerLock = semaphore(1) // one game's art conversation at a time on the single designer thread
const sonnet = (prompt, opts) => sonnetSlot(() => agent(prompt, { effort: 'high', ...opts, model: 'sonnet' }))
const haiku = (prompt, opts) => haikuSlot(() => agent(prompt, { effort: 'low', ...opts, model: 'haiku' }))

// ---------- Schemas ----------
const STEP = {
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
const PREFLIGHT = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    worktrees: {
      type: 'array',
      items: {
        type: 'object',
        properties: { slug: { type: 'string' }, path: { type: 'string' }, branch: { type: 'string' }, head: { type: 'string' }, ready: { type: 'boolean' } },
        required: ['slug', 'path', 'branch', 'head', 'ready'],
      },
    },
    designerReachable: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['ok', 'worktrees', 'designerReachable', 'notes'],
}
const BIBLE = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    batches: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, assets: { type: 'array', items: { type: 'string' } } },
        required: ['id', 'assets'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['ok', 'batches', 'notes'],
}
const SEND = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['delivered', 'partial', 'designer_unreachable', 'timeout'] },
    filesFound: { type: 'array', items: { type: 'string' } },
    missing: { type: 'array', items: { type: 'string' } },
    designerReply: { type: 'string' },
  },
  required: ['status', 'filesFound', 'missing', 'designerReply'],
}
const REVIEW = {
  type: 'object',
  properties: {
    accepted: { type: 'array', items: { type: 'string' } },
    rejected: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, reasons: { type: 'string' } }, required: ['id', 'reasons'] },
    },
    nextBriefWritten: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['accepted', 'rejected', 'nextBriefWritten', 'notes'],
}
const SHIP = {
  type: 'object',
  properties: { pushed: { type: 'boolean' }, branch: { type: 'string' }, head: { type: 'string' }, aheadOfMain: { type: 'number' }, notes: { type: 'string' } },
  required: ['pushed', 'branch', 'head', 'aheadOfMain', 'notes'],
}

// ---------- Shared rules ----------
function rules(ctx) {
  return `
Hard rules for this run:
- WORKSPACE: you work ONLY in the git worktree ${ctx.wt} (branch ${ctx.branch}). Begin every shell command with \`cd ${ctx.wt} && \` and use absolute paths for file tools. Before your first write, confirm \`git -C ${ctx.wt} rev-parse --abbrev-ref HEAD\` prints ${ctx.branch}. Never modify the main checkout ${REPO} or any other worktree. Never switch branches, push, force, rebase, reset, stash, or rewrite history.
- SPEC: the owner's decisions and every game spec are in ${SPEC_FILE} (read-only). Decisions there are final; do not reopen them.
- SCOPE: you may modify only: ${ctx.allowed.join(', ')}. If the task truly needs a change outside these paths, do NOT make it: return status=blocked naming the file and the exact change, so the orchestrator can decide. Everything else is read-only (City Drive, Flutter games, Ludo, other web games, bun.lock, root package.json, tasks/STATUS.md${MODE === 'wave' ? ', apps-games/web-kit' : ''}). ${MODE === 'wave' ? 'Do not add or change dependencies: the skeleton package.json already holds the full v1 dependency set. If a kit bug blocks you, work around it inside this game and record a kit follow-up in .agents/games/' + ctx.slug + '/open-questions.md.' : ''}
- NO VISUAL QA (owner decision): never open a browser, Playwright, Chromium, agent-browser, simulator, emulator or device, and never screenshot the app; never build an APK or install a JDK. Verify headlessly with Vitest (happy-dom), tsc, vite build and Biome. The owner does browser QA at the end.
- Stack: TypeScript, Preact, Vite, Vitest, Capacitor 8, DOM/SVG/Canvas 2D. No game engines, no extra libraries.
- Fonts: OFL fonts named in the game spec, downloaded from github.com/google/fonts, bundled as woff2 under the app's public/fonts with OFL.txt; no rendered text may fall back to the platform default font.
- Audio: CC0 only (Kenney audio packs or a page that explicitly states CC0); record source URL and licence per file. Never synthesize audio and call it CC0.
- Downloads and throwaway files go under ${WT_ROOT}/scratch/${ctx.slug}/ (delete when done), never /tmp and never inside the repo unless they are committed deliverables.
- Evidence and research notes go under ${EVID}/${ctx.slug}/ in the worktree and are committed with the task. Keep the knowledge base .agents/games/${ctx.slug}/ (README, product, economy, store-listing, assets-index, decisions-log, open-questions) updated in the same commit as any decision or number change.
- Never fabricate verification output. Run the commands and read the real output. Run long commands with a timeout or in the background and poll; a hanging test is a bug to fix.
- Pre-existing failures: prove them by running the same command in a throwaway worktree of origin/main under ${WT_ROOT}/scratch/ (git worktree add --detach; remove it afterwards). Proven unrelated failures are recorded as pre-existing and do not fail the task.
- Work incrementally: keep each Write/Edit under ~200 lines, keep code files under 800 lines (repo rule), never search the whole filesystem.
- If the staged-docs (mintlify) pre-commit hook crashes with "Cannot find module", delete the stale cache \`rm -rf $TMPDIR/bunx-*-mintlify@latest\` and retry; it is not a code problem.
- Commits: conventional format, no Co-Authored-By or "Generated with" lines, never --no-verify.`
}

function gameCtx(slug) {
  const g = A.games[slug]
  const epicDir = `tasks/epics/${g.epic}-web-${slug}`
  return {
    kind: 'game', slug, g, epicDir, epicTag: `${g.epic}-web-${slug}`,
    branch: `feat/web-${slug}`, wt: `${WT_ROOT}/web-${slug}`,
    allowed: [`apps-games/${slug}/**`, `apps-games/${slug}-core/**`, `.agents/games/${slug}/**`, `${EVID}/${slug}/**`, `${epicDir}/**`],
    verify: [
      `bun run --filter '@web-games/${slug}*' typecheck`,
      `bun run --filter '@web-games/${slug}*' test`,
      `bun run --filter '@web-games/${slug}' build`,
      `bunx biome check apps-games/${slug} apps-games/${slug}-core`,
    ],
  }
}
function kitCtx() {
  const k = A.kit
  const epicDir = `tasks/epics/${k.epic}-${k.slug}`
  const slugs = Object.keys(A.games)
  return {
    kind: 'kit', slug: k.slug, epicDir, epicTag: `${k.epic}-${k.slug}`,
    branch: k.branch, wt: `${WT_ROOT}/${k.slug}`,
    allowed: [
      'apps-games/web-kit/**', ...slugs.flatMap(s => [`apps-games/${s}/**`, `apps-games/${s}-core/**`, `.agents/games/${s}/README.md`]),
      `${epicDir}/**`, 'tasks/STATUS.md', 'package.json', 'bun.lock', 'biome.json', 'knip.json', 'tsconfig*.json',
      'scripts/games/registry-games.ts', 'scripts/games/registry-types.ts', 'scripts/games/*.test.ts',
      '.github/workflows/web-games-ci.yml', 'docs-internal/gaming/web-games-kit.md', 'docs-internal/docs.json', `${EVID}/kit/**`,
    ],
    verify: [
      `bun run --filter '@web-games/*' typecheck`,
      `bun run --filter '@web-games/*' test`,
      `bun run --filter '@web-games/*' build`,
      'bunx biome check apps-games scripts/games',
      'bun test --max-concurrency=1 scripts/games/registry-web.test.ts',
    ],
  }
}

// ---------- One task: implement -> independent verify -> fix (max 2) -> commit ----------
async function runTask(ctx, t, extra = '') {
  const label = `${ctx.slug} ${t.id}`
  const phaseName = t.phase
  const source = t.inline
    ? `This task has no task file yet. Its full specification:\n${t.inline}`
    : `The task file is ${ctx.epicDir}/${t.file} (read it fully, plus ${ctx.epicDir}/STATUS.md; read earlier task files only as needed).`
  const commitMsg = t.commitMessage || `<type>(${ctx.slug}): <summary> [${ctx.epicTag}/${t.id}]`
  const cmds = (t.verify || ctx.verify).concat(t.extraVerify || []).map(c => `  cd ${ctx.wt} && ${c}`).join('\n')

  const impl = await sonnet(
    `You are implementing task ${t.id} ("${t.title}") of epic ${ctx.epicTag}.
${source}
${extra}
The worktree may already hold partial uncommitted work for THIS task from an earlier attempt: inspect git status/diff first and continue from it.
Implement everything the task requires, with tests. Then run each verification command and report the real result:
${cmds}
${t.file ? `Tick the checklist items you completed in ${ctx.epicDir}/${t.file} and mark the task in-progress in ${ctx.epicDir}/STATUS.md.` : ''}
Do NOT commit. Return status=blocked only for things outside your control (missing credentials, human-only step, broken toolchain), with exact blockers.
${rules(ctx)}`,
    { label: `${label} implement`, phase: phaseName, schema: STEP },
  )
  if (!impl) return { id: t.id, ok: false, reason: 'implement agent died' }
  if (impl.status === 'blocked') return { id: t.id, ok: false, reason: `blocked: ${impl.blockers.join('; ')}`, impl }

  let verdict = null
  for (let attempt = 0; attempt <= MAX_FIX; attempt++) {
    verdict = await sonnet(
      `You are an independent, skeptical verifier for task ${t.id} ("${t.title}") of epic ${ctx.epicTag}. You did not write this work; assume it may be wrong or incomplete.
${source}
${extra}
1. Inspect the uncommitted changes in ${ctx.wt}: git status, git diff, untracked files.
2. Re-run every verification command yourself:
${cmds}
3. Judge every acceptance criterion (from the task file or the specification above) met/unmet with concrete evidence (file:line, command output).
4. Also fail for: scope creep, edits outside the allowed paths, dependency changes in a game branch, placeholder/TODO stubs where real behaviour or content is required, content volume below the spec, skipped or trivially-true tests, copied third-party art/text, missing licence records, text rendered in a default font.
Do not modify files. pass=true only if every criterion is met and every command passes (or a failure is proven pre-existing).
${rules(ctx)}`,
      { label: `${label} verify${attempt ? ' #' + (attempt + 1) : ''}`, phase: phaseName, schema: VERDICT },
    )
    if (!verdict) return { id: t.id, ok: false, reason: 'verify agent died' }
    if (verdict.pass || attempt === MAX_FIX) break
    log(`${label}: verification failed (${verdict.failures.length} issues), fix ${attempt + 1}/${MAX_FIX}`)
    const fix = await sonnet(
      `Fix the verification failures for task ${t.id} ("${t.title}") of epic ${ctx.epicTag}. The work is uncommitted in ${ctx.wt}.
${source}
${extra}
Failures from the independent verifier:
${verdict.failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}
Unmet criteria:
${verdict.criteria.filter(c => !c.met).map(c => `- ${c.criterion}: ${c.evidence}`).join('\n')}
Fix root causes (never weaken tests or criteria), stay in scope, re-run the verification commands and report. Do NOT commit.
${rules(ctx)}`,
      { label: `${label} fix #${attempt + 1}`, phase: phaseName, schema: STEP },
    )
    if (!fix) return { id: t.id, ok: false, reason: 'fix agent died' }
    if (fix.status === 'blocked') return { id: t.id, ok: false, reason: `blocked during fix: ${fix.blockers.join('; ')}` }
  }
  if (!verdict.pass) return { id: t.id, ok: false, reason: `failed verification after ${MAX_FIX} fixes`, failures: verdict.failures }

  const commitPrompt = `Commit task ${t.id} of epic ${ctx.epicTag} in the worktree ${ctx.wt} (branch ${ctx.branch}); it passed independent verification.
1. ${t.file ? `Mark task ${t.id} [x] in ${ctx.epicDir}/STATUS.md.` : 'No task-status update is needed.'}
2. Run \`cd ${ctx.wt} && bunx biome check --write <the changed files>\` limited to files this task changed.
3. Stage only this task's files with explicit paths inside the allowed paths (${ctx.allowed.join(', ')}). Never git add -A; never stage node_modules, dist, build output, .DS_Store or secrets.
4. Commit with message format: ${commitMsg} (fill in type and a concise summary; header under 100 chars). Let hooks run; never --no-verify. If the commit fails, do NOT edit code: return committed=false with the hook output in notes.
5. After committing, run git status --porcelain; if anything this task changed is still uncommitted, list it in notes. Return the new sha (git rev-parse HEAD). Do not push.
${rules(ctx)}`
  let commit = await haiku(commitPrompt, { label: `${label} commit`, phase: phaseName, schema: COMMIT })
  if (!commit || !commit.committed) {
    log(`${label}: commit failed, handing hook failure to sonnet`)
    commit = await sonnet(
      `${commitPrompt}
A previous commit attempt failed: ${commit ? commit.notes : 'agent died'}.
You MAY fix the cause (lint, format, max-lines, staged-type errors) inside this task's files only, re-run the verification commands, then commit.`,
      { label: `${label} commit-fix`, phase: phaseName, schema: COMMIT },
    )
  }
  if (!commit || !commit.committed) return { id: t.id, ok: false, reason: `commit failed: ${commit ? commit.notes : 'agent died'}` }
  log(`${label} committed ${commit.sha}`)
  return { id: t.id, ok: true, sha: commit.sha, summary: impl.summary }
}

async function runSequence(ctx, tasks, extraFor) {
  const results = []
  for (const t of tasks) {
    const r = await runTask(ctx, t, extraFor ? extraFor(t) : '')
    results.push(r)
    if (!r.ok) { log(`${ctx.slug}: stopped at task ${t.id} (${r.reason})`); break }
  }
  return results
}

// ---------- Preflight ----------
async function preflight(ctxs, needDesigner) {
  return haiku(
    `Preflight for the web-games ${MODE} run. Steps, in order:
1. In ${REPO}: git fetch origin. Do not change the main checkout's branch or files.
2. mkdir -p ${WT_ROOT}/scratch ${INBOX}
3. For each worktree below: if the path already exists and is a worktree on the right branch, keep it (report its HEAD); otherwise run \`git -C ${REPO} worktree add -b <branch> <path> origin/main\` (if the branch already exists locally, \`git -C ${REPO} worktree add <path> <branch>\`). Then \`cd <path> && bun install --frozen-lockfile\` and confirm bun.lock is unchanged (git status --porcelain empty apart from nothing). ready=true only when install succeeded and the tree is clean${A.resume ? ` (EXCEPTION: these resumed games may have uncommitted partial work, which must be kept untouched: ${Object.keys(A.resume).join(', ')}; for them ready=true when install succeeded)` : ''}.
${ctxs.map(c => `   - slug ${c.slug}: path ${c.wt}, branch ${c.branch}`).join('\n')}
${MODE === 'wave' ? `4. In each game worktree confirm apps-games/<slug>/package.json and apps-games/<slug>-core/package.json exist (they come from the merged kit, epic 18). If missing, ready=false.` : ''}
${needDesigner ? `5. Load the T3 tools with ToolSearch (query "select:mcp__t3-code__t3_thread_read,mcp__t3-code__t3_thread_send,mcp__t3-code__t3_thread_wait"). Call t3_thread_read with threadId ${DESIGNER}, view "messages", limit 3. designerReachable=true if it returns the thread (do NOT send any message). If the tools cannot be found, designerReachable=false.` : 'designerReachable is not needed for this mode: report true.'}
ok=true only if every worktree is ready${needDesigner ? ' and the designer thread is reachable' : ''}.`,
    { label: 'preflight', phase: 'Preflight', schema: PREFLIGHT },
  )
}

// ---------- Art track (designer thread + strict review), one game at a time ----------
const ART_RUBRIC = `
Art acceptance rubric. An asset is ACCEPTED only if every point holds; when unsure, REJECT. The bar is a featured, award-calibre mobile game, not "good for AI".
1. No text, letters, numbers, signatures, logos or watermarks unless the brief asks for them.
2. No anatomy or construction errors: hands, eyes, teeth, limbs, perspective, symmetry where expected, objects that merge or melt, impossible structures.
3. Style consistency with the art bible AND with every previously accepted asset of this game: palette, line weight, texture, lighting direction, camera/view, rendering technique, scale rules. A set must look like one artist made it.
4. Readability at real display size: check the contact sheets at 1x (icons at 48 and 96 px, sprites at their in-game size). Strong silhouette, clear focal point, no mush.
5. Technical: exact aspect class; transparent assets have a real alpha channel, transparent corners, no baked checkerboard, no halo or fringe; opaque assets have no unintended borders.
6. Composition: safe areas respected (title band, board area, UI bands); backdrops calm where UI or the board sits.
7. No generic AI tells: plastic gloss, airbrushed sameness, random sparkles or bokeh, meaningless micro-detail, inconsistent light sources, muddy gradients, over-saturation, uncanny faces.
8. Purpose: the asset communicates its gameplay meaning instantly and is distinct from its siblings.
9. Originality: no recognisable copyrighted characters, brands or famous artworks.
For identity-bound assets (character expressions), the face, hair, outfit and framing must match the accepted neutral exactly.`

const ARTSTATE = {
  type: 'object',
  properties: {
    bibleExists: { type: 'boolean' },
    accepted: { type: 'array', items: { type: 'string' } },
    batches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          assets: { type: 'array', items: { type: 'string' } },
          lastBriefRound: { type: 'number' },
          lastReviewedRound: { type: 'number' },
          rejectedReasons: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reasons: { type: 'string' } }, required: ['id', 'reasons'] } },
        },
        required: ['id', 'assets', 'lastBriefRound', 'lastReviewedRound', 'rejectedReasons'],
      },
    },
  },
  required: ['bibleExists', 'accepted', 'batches'],
}
const RETRY_ROUNDS = 3

// One batch through send -> strict review rounds. Returns accepted ids, still-pending ids with reasons, and why it ended.
async function runBatch(ctx, base, batchId, assets, startRound, maxRounds, out) {
  let pending = assets.slice()
  const acc = []
  let reasons = []
  let ended = 'done'
  for (let r = startRound; r <= maxRounds && pending.length; r++) {
    const dir = `${base}/${batchId}/round-${r}`
    const sent = await haiku(
      `Deliver one art request to the designer thread and wait for it.
1. Confirm ${dir}/brief.md exists; mkdir -p ${dir}/out. If ${dir}/out/manifest.json already exists and a PNG is present for every one of these ids: ${pending.join(', ')}, do NOT send anything: skip to step 5 and report status delivered with designerReply "already delivered".
2. Load tools: ToolSearch query "select:mcp__t3-code__t3_thread_send,mcp__t3-code__t3_thread_wait,mcp__t3-code__t3_thread_read".
3. Call t3_thread_send with threadId ${DESIGNER}, mode "queue", clientRequestId "web-games-${ctx.slug}-${batchId}-r${r}", and this message exactly:
"Art request ${ctx.slug} / ${batchId} / round ${r} for the game ${ctx.g.title}. Read the style bible ${base}/art-bible.md and the brief ${dir}/brief.md, and look at the already accepted assets in ${base}/accepted/ so this batch matches them exactly. Generate every asset in the brief at the stated size and transparency. Save each final image as PNG to ${dir}/out/<assetId>.png using the exact ids, and write ${dir}/out/manifest.json (array of {assetId, file, model, prompt, size, transparent, notes}). Review your own output against the brief before saving and regenerate anything with text, artefacts or style drift. When every file is saved, reply with exactly: ART-DONE ${dir}/out. If you cannot finish, reply ART-PARTIAL with the reason."
   If the send fails because the tools are unavailable, return status designer_unreachable.
4. Wait, for at most 3 hours in total. The request is finished when a designer reply AFTER your message contains "ART-DONE ${dir}/out" or "ART-PARTIAL", or when ${dir}/out/manifest.json exists and the designer thread is idle. Loop: call t3_thread_wait (threadId ${DESIGNER}, timeoutMs 600000); then t3_thread_read (view "messages", limit 4) and check for the reply. If t3_thread_wait returns immediately while the request is not finished (your queued turn has not started yet), wait with ONE shell command: \`for i in $(seq 1 18); do [ -f ${dir}/out/manifest.json ] && break; sleep 30; done\` (Bash timeout 600000), then check again. Copy the designer's final reply into designerReply.
5. List ${dir}/out. filesFound = the asset ids with a PNG present; missing = these expected ids without a PNG: ${pending.join(', ')}.
status: delivered if nothing is missing, partial if some are, timeout if the 3 hours ran out (still report files found). Do not edit or create any images yourself.`,
      { label: `${ctx.slug} art ${batchId} r${r} send`, phase: 'Art', schema: SEND },
    )
    if (!sent || sent.status === 'designer_unreachable') {
      ended = 'unreachable'
      out.notes.push(`designer unreachable (or send agent died) at ${batchId} round ${r}`)
      reasons = pending.map(id => ({ id, reasons: 'not generated: designer unreachable' }))
      break
    }
    const last = r === maxRounds
    const review = await sonnet(
      `You are the strict art reviewer for "${ctx.g.title}". Review designer output for batch ${batchId}, round ${r} of ${maxRounds}.
Expected assets this round: ${pending.join(', ')}. Missing files count as rejected ("missing").
Inputs: ${base}/art-bible.md, ${dir}/brief.md, ${dir}/out/ (PNG + manifest.json), previously accepted assets in ${base}/accepted/.
Method:
1. Technical checks with python3 (PIL) or magick: dimensions, mode/alpha, corner alpha for transparent assets, file integrity.
2. Build contact sheets into ${dir}/review/: (a) every asset at full size on neutral grey; (b) at real display size (icons at 48 and 96 px, sprites at in-game size from the art bible); (c) the new assets side by side with 3-4 accepted assets (if any) for consistency; (d) transparent assets on both dark and light backgrounds.
3. VIEW every image and every contact sheet with the Read tool. Judge each asset against the rubric. Write ${dir}/review/review.md with a verdict and concrete reasons per asset.
4. For each accepted asset: mkdir -p ${base}/accepted && cp ${dir}/out/<id>.png ${base}/accepted/<id>.png, and append its manifest entry (plus "round": ${r}, "batch": "${batchId}") to ${base}/accepted/manifest.json (create as [] if absent; keep valid JSON).
5. ${last
        ? `This is the final round of this batch: do not write another brief. Rejected assets stay rejected.`
        : `If anything is rejected, write ${base}/${batchId}/round-${r + 1}/brief.md containing ONLY the rejected assets, repeating their original spec from ${dir}/brief.md plus precise, actionable revision notes (what is wrong, what to change, which accepted asset to match), and the same delivery contract with round-${r + 1} paths. Set nextBriefWritten=true.`}
Be harsh: accepting slop is worse than leaving a slot for a placeholder. Judge the asset, not the effort: small flaws that are invisible at display size and do not break style are acceptable; flaws that a player would notice are not.
${ART_RUBRIC}
Rules: write only under ${base}; do not touch the worktree or the main checkout; never edit or regenerate images yourself.`,
      { label: `${ctx.slug} art ${batchId} r${r} review`, phase: 'Art', schema: REVIEW },
    )
    if (!review) { ended = 'review_died'; out.notes.push(`review agent died at ${batchId} round ${r}`); reasons = pending.map(id => ({ id, reasons: 'review agent died' })); break }
    acc.push(...review.accepted)
    pending = review.rejected.map(x => x.id)
    reasons = review.rejected
    if (pending.length && !last && !review.nextBriefWritten) { ended = 'exhausted'; out.notes.push(`${batchId} round ${r}: no next brief written`); break }
    if (pending.length && last) ended = 'exhausted'
  }
  log(`${ctx.slug} art ${batchId}: +${acc.length} accepted, ${pending.length} still rejected (${ended})`)
  return { accepted: acc, pending, reasons, ended }
}

async function artTrack(ctx, resumeArt) {
  return designerLock(async () => {
    const base = `${INBOX}/${ctx.slug}`
    const out = { status: 'ok', accepted: [], rejected: [], notes: [] }
    let batches = []
    let state = null
    if (resumeArt) {
      state = await haiku(
        `Report the current art state for ${ctx.slug} from the files under ${base} (read-only).
- bibleExists: ${base}/art-bible.md exists.
- accepted: the asset ids (file names without .png) of every PNG in ${base}/accepted/.
- batches: every batch directory (b1, b2, ... in numeric order, then "retry" if it exists). For each: assets = the asset ids listed in its round-1/brief.md (exact ids as used for file names); lastBriefRound = highest N with round-N/brief.md (0 if none); lastReviewedRound = highest N with round-N/review/review.md (0 if none); rejectedReasons = for the last reviewed round, each asset judged rejected in review.md with a one-sentence reason (empty if none).`,
        { label: `${ctx.slug} art state`, phase: 'Art', schema: ARTSTATE },
      )
    }
    if (state && state.bibleExists && state.batches.length) {
      batches = state.batches
      out.accepted.push(...state.accepted)
    } else {
      const bible = await sonnet(
        `You are the art director for "${ctx.g.title}" (${ctx.slug}). Prepare the art plan for the external designer (an image-generation agent in another thread that can read local files).
Read: the game spec for ${ctx.slug} in ${SPEC_FILE} (artStyle, artAssets), and in the worktree ${ctx.wt}: .agents/games/${ctx.slug}/product.md and the content plan in .agents/games/${ctx.slug}/ (asset names for items/cases/customers come from there).
Write, OUTSIDE the repo:
1. ${base}/art-bible.md: the style bible: mood, palette with hex values, materials/texture, line and edge treatment, lighting direction, camera/view rules per asset class, scale rules, what to avoid (the rubric below), and how each asset is used in the UI (display size, what overlays it).
2. One folder per batch ${base}/<batchId>/round-1/ with brief.md listing every asset of that batch: exact asset id (file name), aspect class (square 1:1, portrait 2:3 or 3:4, landscape 3:2), generation size (1024x1024, 1024x1536 or 1536x1024), transparent or opaque, purpose, subject, composition and safe areas, and specific must-nots. Batch order and contents must follow artAssets in the spec; batch 1 is the style anchor. Use ids b1, b2, ... and at most 12 assets per batch (split larger spec batches).
3. Each brief.md ends with the delivery contract: save every image as PNG to <batch>/round-<n>/out/<assetId>.png with exact ids, and write out/manifest.json as an array of {assetId, file, model, prompt, size, transparent, notes}.
Return ok=false only if the spec or content plan is missing information you cannot resolve; batches = the ordered batch ids with their asset ids.
${ART_RUBRIC}
Rules: do not modify the worktree or the main checkout; write only under ${base}.`,
        { label: `${ctx.slug} art-bible`, phase: 'Art', schema: BIBLE },
      )
      if (!bible || !bible.ok || !bible.batches.length) {
        out.status = 'failed'
        out.notes.push(`art bible failed: ${bible ? bible.notes : 'agent died'}`)
        return out
      }
      batches = bible.batches.map(b => ({ id: b.id, assets: b.assets, lastBriefRound: 1, lastReviewedRound: 0, rejectedReasons: [] }))
    }

    const exhausted = [] // {id, reasons}
    const main = batches.filter(b => b.id !== 'retry')
    for (let bi = 0; bi < main.length; bi++) {
      const b = main[bi]
      const pendingNow = b.assets.filter(id => !out.accepted.includes(id))
      if (pendingNow.length) {
        let startRound = 1
        let canRun = true
        if (b.lastBriefRound > b.lastReviewedRound) startRound = b.lastBriefRound
        else if (b.lastReviewedRound > 0) { startRound = b.lastReviewedRound + 1; canRun = false } // no brief for the next round: exhausted
        if (!canRun || startRound > MAX_ART_ROUNDS) {
          exhausted.push(...pendingNow.map(id => ({ id, reasons: (b.rejectedReasons.find(x => x.id === id) || {}).reasons || 'rejected in earlier rounds' })))
        } else {
          const res = await runBatch(ctx, base, b.id, pendingNow, startRound, MAX_ART_ROUNDS, out)
          out.accepted.push(...res.accepted)
          if (res.ended === 'unreachable' || res.ended === 'review_died') {
            out.status = 'designer_unreachable'
            out.rejected.push(...res.reasons)
            for (const later of main.slice(bi + 1)) out.rejected.push(...later.assets.filter(id => !out.accepted.includes(id)).map(id => ({ id, reasons: 'not requested: art track stopped early' })))
            return out
          }
          exhausted.push(...res.reasons.filter(x => res.pending.includes(x.id)))
        }
      }
      if (bi === 0) {
        const anchorAccepted = b.assets.filter(id => out.accepted.includes(id))
        if (anchorAccepted.length < 2) {
          out.status = 'style_anchor_failed'
          out.notes.push('style anchor needs at least two accepted assets to fix the style; later batches were not requested (orchestrator decision needed)')
          out.rejected.push(...exhausted)
          for (const later of main.slice(1)) out.rejected.push(...later.assets.filter(id => !out.accepted.includes(id)).map(id => ({ id, reasons: 'not requested: style anchor failed' })))
          return out
        }
      }
    }

    // Final retry batch for assets that exhausted their rounds: a fresh, consolidated brief.
    const retryState = batches.find(b => b.id === 'retry')
    const retryIds = exhausted.map(x => x.id).filter(id => !out.accepted.includes(id))
    if (retryIds.length) {
      let start = 1
      if (retryState && retryState.lastBriefRound > retryState.lastReviewedRound) start = retryState.lastBriefRound
      else if (retryState && retryState.lastReviewedRound > 0) start = RETRY_ROUNDS + 1 // retry already used up
      if (start === 1 && !(retryState && retryState.lastBriefRound >= 1)) {
        const brief = await sonnet(
          `You are the art director for "${ctx.g.title}". These assets were rejected in every review round: ${exhausted.filter(x => retryIds.includes(x.id)).map(x => `${x.id} (last verdict: ${x.reasons})`).join('; ')}.
Read ${base}/art-bible.md, each asset's original spec in ${base}/b*/round-1/brief.md, and every review in ${base}/b*/round-*/review/review.md for these assets, and look at the accepted assets in ${base}/accepted/.
Write ${base}/retry/round-1/brief.md: one consolidated brief for ONLY these assets. Keep each asset's id, size, transparency and gameplay purpose; you may simplify composition, reduce element count or change the framing to remove the recurring failure causes. List the recurring failures explicitly as must-nots and point to accepted assets to match. End with the delivery contract (PNG to ${base}/retry/round-<n>/out/<assetId>.png and out/manifest.json array of {assetId, file, model, prompt, size, transparent, notes}).
Rules: write only under ${base}.`,
          { label: `${ctx.slug} art retry-brief`, phase: 'Art', schema: { type: 'object', properties: { written: { type: 'boolean' }, notes: { type: 'string' } }, required: ['written', 'notes'] } },
        )
        if (!brief || !brief.written) start = RETRY_ROUNDS + 1
      }
      if (start <= RETRY_ROUNDS) {
        const res = await runBatch(ctx, base, 'retry', retryIds, start, RETRY_ROUNDS, out)
        out.accepted.push(...res.accepted)
        out.rejected.push(...res.reasons.filter(x => res.pending.includes(x.id)).map(x => ({ id: x.id, reasons: `final: ${x.reasons}` })))
        if (res.ended === 'unreachable' || res.ended === 'review_died') out.status = 'designer_unreachable'
      } else {
        out.rejected.push(...exhausted.filter(x => retryIds.includes(x.id)).map(x => ({ id: x.id, reasons: `final: ${x.reasons}` })))
      }
    }
    return out
  })
}

// ---------- Game pipeline ----------
function planTask(ctx) {
  const g = ctx.g
  return {
    id: '00', title: 'Knowledge base, design spec and epic task files', phase: 'Plan',
    commitMessage: `docs(${ctx.slug}): knowledge base, design spec and epic tasks [${ctx.epicTag}/00]`,
    inline: `Plan the full v1 of "${g.title}" (${ctx.slug}, epic ${g.epic}). The game spec (pitch, coreLoop, content, progression, fonts, artStyle, artAssets) is in ${SPEC_FILE} under games["${ctx.slug}"]; the owner decisions are under "decisions"; the kit is apps-games/web-kit (read its README) and the skeleton is apps-games/${ctx.slug} + apps-games/${ctx.slug}-core.
Deliverables (all in the worktree):
A. Knowledge base .agents/games/${ctx.slug}/: README.md (quick-facts table), product.md (precise v1 loop, rules, screens list, controls, onboarding, accessibility), economy.md (every currency, source, sink and number), content-plan.md (the COMPLETE named list of all v1 content: levels/maps/chapters, items, customers, cases with their evidence objects, constellations, lore titles, as the spec requires; this list drives the art briefs), store-listing.md (draft answers: short/long description, category, content rating notes, data safety = no data collected), assets-index.md (planned art slots, fonts, audio), decisions-log.md (dated ${DATE} entries for every owner decision and design decision with rationale), open-questions.md.
B. Epic folder ${ctx.epicDir}/: STATUS.md (purpose, decisions table, scope fence = allowed paths, task table 00-08) and exactly these task files: ${A.gameTasks.map(t => `${t.file} ("${t.title}")`).join('; ')}.
   Each task file uses this structure: frontmatter (epic, task, status, commit_scope ${ctx.slug}, depends_on, owner agent), Goal, Context/Decisions, Implementation Checklist (checkboxes, concrete and game-specific), Files Touched, Acceptance Criteria (testable), Verification Commands (exactly: ${ctx.verify.join(' ; ')}), Out of Scope, Commit message (format type(${ctx.slug}): summary [${ctx.epicTag}/NN]).
   Fixed rules for the task contents: 01 is headless rules in apps-games/${ctx.slug}-core with exhaustive tests; 02 ships the FULL content volume from the spec with validator tests; 03 adds progression/economy/daily/save on the kit save store with migrations tests; 04 builds every screen with the kit primitives, design tokens, the spec fonts, accessible contrast and hit areas, code-drawn visuals in the art-bible palette, and named image slots that fall back to tasteful code-drawn placeholders; 05 adds CC0 audio, haptics, motion and onboarding/how-to-play; 06 integrates reviewed art from the designer inbox (WebP at 2x display size, masters as WebP q90 under ${EVID}/${ctx.slug}/art/masters, provenance in assets-index.md, placeholders kept for rejected slots, art budget test <= 8 MB); 07 adds Capacitor android+ios projects (cap add, @capacitor/assets icons/splash from the accepted icon and key art, cap sync; no gradle/xcode builds); 08 is release readiness (all checks, JS bundle <= 300 KB gzip excluding art, knowledge base complete, owner browser QA checklist at ${EVID}/${ctx.slug}/qa-checklist.md). No task may require visual QA, devices or browsers.
Acceptance: every file above exists and is specific to this game (no generic filler), the content plan names every content item the spec requires, numbers are consistent across files, and no code is changed in this task.`,
  }
}

async function runGame(slug) {
  const ctx = gameCtx(slug)
  const R = (A.resume && A.resume[slug]) || {}
  const startAt = R.startAt || '00'
  const redo = R.redo || []
  const res = { slug, plan: null, build: [], art: null, finish: [], ship: null, status: 'running' }
  if (startAt === '00') {
    const plan = await runTask(ctx, planTask(ctx))
    res.plan = plan
    if (!plan.ok) { res.status = `stopped at plan: ${plan.reason}`; return res }
  }
  const redoNote = t => (redo.includes(t.id)
    ? `RESUME NOTE: task ${t.id} was already completed and committed once, with the art that existed then. Do an UPDATE pass: integrate what changed since (new accepted art listed below), keep everything that already works, keep the task marked done, and commit only the delta.`
    : '')

  const codeTasks = A.gameTasks.filter(t => ['01', '02', '03', '04', '05'].includes(t.id) && t.id >= startAt).map(t => ({ ...t, phase: 'Build' }))
  const [build, art] = await Promise.all([runSequence(ctx, codeTasks, redoNote), artTrack(ctx, R.art === 'continue')])
  res.build = build
  res.art = art
  if (build.length !== codeTasks.length || !build.every(r => r && r.ok)) {
    res.status = 'stopped in build'
  } else {
    const finishTasks = A.gameTasks.filter(t => ['06', '07', '08'].includes(t.id) && (t.id >= startAt || redo.includes(t.id))).map(t => ({ ...t, phase: 'Finish' }))
    const artFacts = `Art track result (from the designer review loop): status=${art ? art.status : 'missing'}; accepted assets (in ${INBOX}/${slug}/accepted/ with manifest.json): ${art ? art.accepted.join(', ') || 'none' : 'none'}; rejected or not generated (keep the code-drawn placeholder, list each in assets-index.md and open-questions.md): ${art ? art.rejected.map(x => `${x.id} (${x.reasons})`).join('; ') || 'none' : 'all'}. Art bible: ${INBOX}/${slug}/art-bible.md; review notes: ${INBOX}/${slug}/<batch>/round-<n>/review/review.md. Copy the art bible and the review notes into ${EVID}/${slug}/art/ as evidence. Never use an image that is not in the accepted folder.`
    res.finish = await runSequence(ctx, finishTasks, t => [redoNote(t), artFacts].filter(Boolean).join('\n'))
    res.status = res.finish.length === finishTasks.length && res.finish.every(r => r && r.ok) ? 'complete' : 'stopped in finish'
  }
  res.ship = await ship(ctx)
  return res
}

async function ship(ctx) {
  return haiku(
    `Push the branch ${ctx.branch} from worktree ${ctx.wt}. Steps: cd ${ctx.wt}; git status --porcelain (report any leftovers in notes, do not commit them); git fetch origin; aheadOfMain = git rev-list --count origin/main..HEAD; if aheadOfMain > 0 run git push -u origin ${ctx.branch} (plain push, never force; let the pre-push hook run, never --no-verify). Return pushed, branch, head sha, aheadOfMain, notes (include the push output summary). Do not open a PR and do not merge anything.`,
    { label: `${ctx.slug} push`, phase: 'Ship', schema: SHIP },
  )
}

// ---------- Main ----------
if (MODE === 'kit') {
  const ctx = kitCtx()
  phase('Preflight')
  const pre = await preflight([ctx], false)
  if (!pre || !pre.ok) return { stoppedAt: 'preflight', preflight: pre }

  phase('Kit')
  const k = A.kit
  const k00 = {
    id: '00', title: 'Kit epic, task files and portfolio status', phase: 'Kit',
    commitMessage: `docs(web-games-kit): epic 18 tasks and web-games epics 18-24 [${ctx.epicTag}/00]`,
    inline: `Create ${ctx.epicDir}/STATUS.md (purpose, owner decisions copied from "decisions" in ${SPEC_FILE} dated ${DATE}, scope fence, task table 00-03) and the task files ${k.tasks.map(t => `${t.file} ("${t.title}")`).join('; ')}, each expanding its "scope" from the kit spec in ${SPEC_FILE} into: frontmatter, Goal, Context/Decisions (include the pin rule: ${k.pins}), Implementation Checklist, Files Touched, Acceptance Criteria, Verification Commands (exactly: ${ctx.verify.join(' ; ')}), Out of Scope, Commit message (type(web-games-kit): summary [${ctx.epicTag}/NN]). Add epics 18-24 to tasks/STATUS.md as unchecked lines in the existing style: 18 Web games kit; 19 Lantern Loops; 20 Floodplain Dispatch; 21 Cloud Observatory; 22 The Last Window; 23 Dress Rehearsal; 24 Lost Parcel Desk (web games, full v1). No code in this task.`,
  }
  k00.verify = [`ls ${ctx.epicDir}`, 'git status --porcelain']
  const kitVerify = {
    '01': [`bun run --filter '@web-games/kit' typecheck`, `bun run --filter '@web-games/kit' test`, 'bunx biome check apps-games/web-kit'],
  }
  const kitTasks = [k00, ...k.tasks.map(t => ({ ...t, phase: 'Kit', verify: kitVerify[t.id] }))]
  const results = await runSequence(ctx, kitTasks)
  const complete = results.length === kitTasks.length && results.every(r => r.ok)

  phase('Ship')
  const shipped = await ship(ctx)

  phase('Report')
  const report = await haiku(
    `Summarise the web-games kit run for the orchestrator in under 250 words. Run in ${ctx.wt}: git log --oneline origin/main..HEAD and git status --porcelain. Results: ${JSON.stringify(results.map(r => ({ id: r.id, ok: r.ok, sha: r.sha, reason: r.reason })))}. Push: ${JSON.stringify(shipped)}. State completed tasks, where it stopped and why, and leftovers. Do not modify anything.`,
    { label: 'report', phase: 'Report' },
  )
  return { mode: 'kit', complete, branch: ctx.branch, worktree: ctx.wt, results, shipped, report }
}

// wave mode
const ctxs = A.wave.map(gameCtx)
phase('Preflight')
const pre = await preflight(ctxs, true)
if (!pre || !pre.ok) return { stoppedAt: 'preflight', preflight: pre }

phase('Plan')
log(`Wave: ${A.wave.join(', ')}. Max 4 sonnet agents at once; art requests go to the designer thread one game at a time.`)
const games = await parallel(A.wave.map(slug => () => runGame(slug)))

phase('Report')
const summary = games.map((g, i) => g ? {
  slug: g.slug, status: g.status,
  tasks: [g.plan, ...g.build, ...g.finish].filter(Boolean).map(r => ({ id: r.id, ok: r.ok, sha: r.sha, reason: r.reason })),
  art: g.art ? { status: g.art.status, accepted: g.art.accepted.length, rejected: g.art.rejected, notes: g.art.notes } : null,
  ship: g.ship,
} : { slug: A.wave[i], status: 'pipeline crashed' })
const report = await haiku(
  `Summarise this web-games wave for the orchestrator in under 400 words: per game, the status, committed tasks, where it stopped and why, art accepted/rejected counts and any art decisions needed, and push status. Data: ${JSON.stringify(summary)}. Do not modify anything.`,
  { label: 'report', phase: 'Report' },
)
return { mode: 'wave', wave: A.wave, summary, report }
