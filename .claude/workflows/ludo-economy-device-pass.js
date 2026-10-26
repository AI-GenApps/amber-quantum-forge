export const meta = {
  name: 'ludo-economy-device-pass',
  description: 'Run last, with the Android phone connected: haiku agents drive the device for Ludo tasks 26g and 26h, sonnet reviews the screenshots, fixes defects (max 2) and commits the evidence',
  whenToUse: 'After ludo-economy-release-sequential has committed 26g/26h. Needs a USB-debugging-authorized Android device',
  phases: [
    { title: 'Device check', detail: 'haiku waits for the phone and confirms adb access', model: 'haiku' },
    { title: 'Device tasks', detail: 'haiku drives the phone -> sonnet reviews screenshots -> sonnet fixes -> haiku re-runs -> sonnet commits', model: 'haiku' },
    { title: 'Report', detail: 'final status summary', model: 'sonnet' },
  ],
}

// args: { branch?, epicDir?, deviceSerial?, deviceWaitRounds?, allowDirty?, reviewDirty?, note?, tasks: [{ id, file }] }
// allowDirty: tolerate uncommitted changes from an earlier interrupted device pass. reviewDirty: sonnet reviews that uncommitted diff before the device run.
// note: extra orchestrator guidance appended to device and review prompts.
// Only haiku agents ever touch the phone. Sonnet agents review images and edit code but never use adb.
const A = args || {}
const BRANCH = A.branch || 'main'
const EPIC = A.epicDir || 'tasks/epics/15-ludo-launch'
const TASKS = Array.isArray(A.tasks) ? A.tasks : []
const WAIT_ROUNDS = A.deviceWaitRounds || 3
const MAX_FIX = 2
const ALLOW_DIRTY = !!A.allowDirty
const REVIEW_DIRTY = !!A.reviewDirty
const NOTE = A.note ? `\nOrchestrator note for this run: ${A.note}\n` : ''
const SONNET = { model: 'sonnet' }
const HAIKU = { model: 'haiku' }
const EVIDENCE = '.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence'

const RULES = `
Hard rules for this run:
- Toolchain: flutter and dart are NOT on the default PATH. Start every shell command that uses them with: export PATH="$HOME/flutter/bin:$PATH" (Flutter 3.47.3 / Dart 3.13.3 live in ~/flutter). A bun version MISMATCH line from games:doctor is only a warning.
- Work only on git branch ${BRANCH} in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Never push, never force, never rewrite history, never switch branches, never use git stash.
- You (a sonnet agent) must NOT run adb, "games:run", "flutter run" or "flutter install" and must never boot emulators/simulators; haiku device agents do all phone work. You review the saved images with the Read tool and edit code only to fix defects found on the device. Building and unit/widget tests are allowed.
- Task 26f art is skipped by the user's decision (fallback code-drawn art is expected in store/theme slots); that is not a defect. Never generate or copy bitmap art.
- Never fabricate results. Keep AdMob on test unit IDs only; no secrets in the repo; atomic check-and-write for caps.
- Never run migrations or tests against DATABASE_URL from .env files. Do not delegate to other agents.`

const DEVICE_RULES = `
Rules for device agents (you are the ONLY agent type allowed to touch the Android phone):
- flutter and dart are NOT on the default PATH: start every shell command that builds or runs the app with: export PATH="$HOME/flutter/bin:$PATH".
- Use only adb and the repo's own commands in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge. Never boot an emulator or simulator.
- First run "adb devices -l". Use the serial given to you (or the first device in state "device"). If no device is in state "device" (missing, "unauthorized" or "offline"), do nothing else and report deviceAvailable=false with the reason.
- Wake the screen with "adb -s <serial> shell input keyevent KEYCODE_WAKEUP"; swipe up to dismiss a lock screen only if there is no PIN/pattern. If a PIN blocks you, report deviceAvailable=false with that reason.
- Do not change device settings, do not uninstall or open apps other than app.w3dev.ludo.debug, and never complete a real-money Google Play payment or enter credentials. Exercise only coin/diamond spends, test ads, free daily claims and the store UI up to (not past) the real-money confirmation sheet.
- Drive the UI via "adb shell uiautomator dump" + "adb shell input tap/swipe/text/keyevent" using element bounds from the dump (display is 1080x2400). Take "adb exec-out screencap -p > <file>.png" before and after each meaningful step. Screen recordings (adb shell screenrecord, max 180 s per clip, then adb pull) are allowed for animated or ad flows.
- Build/install/launch with: bun run games:run -- --app ludo --device-id <serial> (run long commands in the background with a timeout and poll). Debug flavor id is app.w3dev.ludo.debug.
- Save every screenshot and recording under ${EVIDENCE}/<task-id>/ with descriptive names and list their repo-relative paths in your report. A step you could not perform is "not_run" or "fail" with the reason; never fake it.
- You do not edit source code and you do not commit.`

const DEVICE_CHECK = {
  type: 'object',
  properties: { deviceAvailable: { type: 'boolean' }, serial: { type: 'string' }, model: { type: 'string' }, notes: { type: 'string' } },
  required: ['deviceAvailable', 'serial', 'notes'],
}

const DEVICE = {
  type: 'object',
  properties: {
    deviceAvailable: { type: 'boolean' },
    serial: { type: 'string' },
    installed: { type: 'boolean' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: { step: { type: 'string' }, result: { type: 'string', enum: ['pass', 'fail', 'not_run'] }, note: { type: 'string' } },
        required: ['step', 'result'],
      },
    },
    screenshots: { type: 'array', items: { type: 'string' } },
    recordings: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['deviceAvailable', 'steps', 'screenshots', 'recordings', 'notes'],
}

const REVIEW = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    defects: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['pass', 'defects', 'notes'],
}

const FIX = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'summary', 'filesChanged', 'blockers'],
}

const COMMIT = {
  type: 'object',
  properties: { committed: { type: 'boolean' }, sha: { type: 'string' }, message: { type: 'string' }, notes: { type: 'string' } },
  required: ['committed', 'sha', 'message', 'notes'],
}

// ---------- Device check ----------
phase('Device check')
let dev = null
for (let i = 0; i < WAIT_ROUNDS; i++) {
  dev = await agent(
    `${DEVICE_RULES}
Task: check whether an Android device is connected and usable.
1. Run "adb devices -l". If a device is in state "device", report serial${A.deviceSerial ? ` (prefer ${A.deviceSerial})` : ''} and model.
2. If none, run "timeout 500 adb wait-for-device" once (waits for the user to plug the phone in), then "adb devices -l" again.
3. If the device is "unauthorized", say the USB-debugging prompt must be accepted on the phone.
Do nothing else. Do not build or install anything.`,
    { ...HAIKU, label: `device check ${i + 1}/${WAIT_ROUNDS}`, phase: 'Device check', schema: DEVICE_CHECK, effort: 'low' },
  )
  if (dev && dev.deviceAvailable) break
  log(`No usable Android device yet (${dev ? dev.notes : 'agent died'})`)
}
if (!dev || !dev.deviceAvailable) {
  log('No Android device — stopping. Connect the phone, accept USB debugging, and re-run this workflow.')
  return { stoppedAt: 'device-check', device: dev }
}
const serial = dev.serial
log(`Android device ready: ${serial} ${dev.model || ''}`)

const pre = await agent(
  `Read-only check in /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge: confirm branch ${BRANCH} is checked out, git status --porcelain is empty or lists only untracked files under .claude/workflows/ or .claude/worktrees/ ${ALLOW_DIRTY ? '(or uncommitted changes under apps-native/games/ludo, packages/api/src/games/ludo, tasks/epics/15-ludo-launch or .agents/ left by an earlier interrupted device pass — list them)' : ''} (report anything else), and these exist: ${TASKS.map(t => `${EVIDENCE}/${t.id}/device-flow.md`).join(', ')}. Do not run adb or modify files. Return ok=true only if all hold.`,
  { ...SONNET, label: 'repo check', phase: 'Device check', schema: { type: 'object', properties: { ok: { type: 'boolean' }, notes: { type: 'string' } }, required: ['ok', 'notes'] }, effort: 'low' },
)
if (!pre || !pre.ok) {
  log('Repo check failed — stopping.')
  return { stoppedAt: 'repo-check', pre }
}

// ---------- Device tasks (strictly sequential) ----------
phase('Device tasks')
const results = []
let stopReason = null

function devicePrompt(t, extra) {
  return `${DEVICE_RULES}
You are the device agent for Ludo task ${t.id}. Device serial: ${serial}.
1. Read ${EPIC}/${t.file} (the device-evidence checklist item and acceptance criterion) and the flow file ${EVIDENCE}/${t.id}/device-flow.md.
2. Install and launch the debug app with the repo command, then execute the flow step by step, taking screenshots before and after each step into ${EVIDENCE}/${t.id}/ (add a screen recording for the ad flow / animations).
3. Report each step as pass/fail/not_run. If the app crashes, shows a black screen, white or empty areas, clipped text or an error, mark that step fail and attach the relevant "adb -s ${serial} logcat -d -t 200" lines in notes.
${extra || ''}${NOTE}`
}

for (const t of TASKS) {
  const taskPath = `${EPIC}/${t.file}`
  const tag = `task ${t.id}`
  log(`Starting device pass for ${tag}`)

  if (REVIEW_DIRTY) {
    const dirty = await agent(
      `Review the UNCOMMITTED source changes left by an earlier interrupted device pass for Ludo task ${t.id} (${taskPath}). They were written by a fix agent during device debugging and never independently reviewed. You never touch the device.
1. git status / git diff for apps-native/games/ludo, packages/api/src/games/ludo and the task file. Understand what each change does and why.
2. Judge: correctness, scope creep beyond ${t.id}, AdMob real (non-test) unit IDs reachable from debug builds, weakened or trivially-true tests, read-then-write caps (must be atomic check-and-write), hacks that only paper over the on-device ad-load failure (the failure was a device environment problem, so app code should not contain workarounds for a broken WebView).
3. Run: export PATH="$HOME/flutter/bin:$PATH"; bun run games:format -- --check; bun run games:analyze -- --app ludo; bun run games:test -- --app ludo.
pass=true only if the diff is sound and checks pass; otherwise list concrete defects. Do NOT modify files.${NOTE}
${RULES}`,
      { ...SONNET, label: `diff review ${t.id}`, phase: 'Device tasks', schema: REVIEW },
    )
    if (!dirty) { stopReason = `${tag}: diff review agent died`; break }
    if (!dirty.pass) {
      log(`${tag}: uncommitted diff has ${dirty.defects.length} defect(s) — one fix attempt before the device run`)
      const dfix = await agent(
        `Fix these defects in the uncommitted changes for Ludo task ${t.id} (${taskPath}); revert any change that is not needed. Defects:
${dirty.defects.map((d, i) => `${i + 1}. ${d}`).join('\n')}
Re-run games:format --check, games:analyze and games:test for ludo. Do NOT commit and do NOT touch the device.${NOTE}
${RULES}`,
        { ...SONNET, label: `diff fix ${t.id}`, phase: 'Device tasks', schema: FIX },
      )
      if (!dfix || dfix.status === 'blocked') { stopReason = `${tag}: could not fix the uncommitted diff (${dfix ? dfix.blockers.join('; ') : 'agent died'})`; break }
    }
  }

  let device = null
  let review = null
  for (let attempt = 0; attempt <= MAX_FIX; attempt++) {
    device = await agent(devicePrompt(t, attempt ? `This is re-run #${attempt} after a code fix; overwrite or add screenshots with a "-rerun${attempt}" suffix.` : ''), {
      ...HAIKU,
      label: `device ${t.id}${attempt ? ` re-run #${attempt}` : ''}`,
      phase: 'Device tasks',
      schema: DEVICE,
    })
    if (!device || !device.deviceAvailable) { stopReason = `${tag}: device lost (${device ? device.notes : 'agent died'})`; break }

    review = await agent(
      `You are an independent reviewer of on-device evidence for Ludo task ${t.id} (${taskPath}). You never touch the device.
Haiku device report: ${JSON.stringify(device)}
1. Read the task's acceptance criteria and ${EVIDENCE}/${t.id}/device-flow.md.
2. VIEW every screenshot listed (Read tool). Confirm each exists on disk. Judge critically against the flow's expected results: a crash, error screen, black/white empty regions, clipped or overflowing text, Material-default styling, misaligned elements, a flow step that did not advance, or a haiku step reported fail/not_run are defects. Code-drawn fallback art in theme/banner slots is expected (task 26f skipped) and is not a defect.
3. For test ads confirm the flow used test ad units (check the debug config in code) and the reward landed in the wallet/daily-claim UI.
pass=true only if the task's device-evidence criterion is genuinely satisfied. List each defect concretely (screen, symptom, likely code area).${NOTE}
${RULES}`,
      { ...SONNET, label: `review ${t.id}${attempt ? ` #${attempt + 1}` : ''}`, phase: 'Device tasks', schema: REVIEW },
    )
    if (!review) { stopReason = `${tag}: review agent died`; break }
    if (review.pass) break
    if (attempt === MAX_FIX) break
    log(`${tag}: device review found ${review.defects.length} defect(s) — fix attempt ${attempt + 1}/${MAX_FIX}`)
    const fix = await agent(
      `Fix the defects found on the physical device for Ludo task ${t.id} (${taskPath}). Work on top of the already-committed code, uncommitted.
Defects:
${review.defects.map((d, i) => `${i + 1}. ${d}`).join('\n')}
Haiku device notes: ${device.notes}
Find root causes in apps-native/games/ludo (or packages/api/src/games/ludo if the defect is server-side), add or adjust a test that would have caught each defect, run the affected non-device checks (games:analyze, games:test for ludo, bun run typecheck if backend changed), and report. Stay inside the task's scope. Do NOT commit.
${RULES}`,
      { ...SONNET, label: `fix ${t.id} #${attempt + 1}`, phase: 'Device tasks', schema: FIX },
    )
    if (!fix) { stopReason = `${tag}: fix agent died`; break }
    if (fix.status === 'blocked') { stopReason = `${tag} blocked during fix: ${fix.blockers.join('; ')}`; break }
  }
  if (stopReason) { results.push({ id: t.id, device, review, commit: null }); break }
  if (!review.pass) {
    stopReason = `${tag} still has device defects after ${MAX_FIX} fix attempts: ${review.defects.join('; ')}`
    results.push({ id: t.id, device, review, commit: null })
    break
  }

  const commit = await agent(
    `Commit the device evidence (and any device-driven fixes) for Ludo task ${t.id}. The device review passed. You never touch the device.
1. In ${taskPath} tick the "Capture device evidence" checklist item and remove the "device evidence pending" note; add a short list of the evidence files.
2. If source files changed (device-driven fixes), run: bun run games:format -- --check, bun run games:analyze -- --app ludo, bun run games:test -- --app ludo, and bun run check (plus bun run typecheck if backend files changed); fix only this change's issues. If bun run check fails only because of a nested biome.json under the untracked .claude/worktrees/ (another session's folder: do not move, delete or commit it), run "bunx biome check" on just the changed files instead and note it.
3. Stage only evidence under ${EVIDENCE}/${t.id}/ (images and recordings; skip any recording over 20 MB and list it instead), the task file, and any fixed source/test files, with explicit paths. Never git add -A.
4. Commit on ${BRANCH}. Message: "docs(ludo): add device evidence for economy ${t.id} [15-ludo-launch/${t.id}]" if only evidence/docs changed, otherwise "fix(ludo): fix device issues in economy ${t.id} and add device evidence [15-ludo-launch/${t.id}]". Let hooks run; never --no-verify; never push.
5. Return the sha.
${RULES}`,
    { ...SONNET, label: `commit ${t.id}`, phase: 'Device tasks', schema: COMMIT, effort: 'low' },
  )
  results.push({ id: t.id, device: { steps: device.steps.length, screenshots: device.screenshots.length, recordings: device.recordings.length }, review: { pass: review.pass, notes: review.notes }, commit })
  if (!commit || !commit.committed) { stopReason = `${tag}: commit failed — ${commit ? commit.notes : 'agent died'}`; break }
  log(`${tag} committed ${commit.sha}`)
}

// ---------- Report ----------
phase('Report')
const report = await agent(
  `Write a concise status report of the Ludo device pass on branch ${BRANCH}.
Run: git log --oneline -8 and git status --porcelain.
Stop reason (null = all done): ${JSON.stringify(stopReason)}.
Results: ${JSON.stringify(results.map(r => ({ id: r.id, sha: r.commit && r.commit.sha, pass: r.review && r.review.pass, defects: r.review && r.review.defects, device: r.device && r.device.steps })))}
Report: tasks with device evidence committed (shas, evidence paths), any remaining defects, and the human items left: task 26f art session, task 29 acceptance/provisioning, RevenueCat/AdMob/Firebase console setup. Under 250 words. Do not modify files and do not touch the device.`,
  { ...SONNET, label: 'report', phase: 'Report', effort: 'low' },
)

return { stopReason, results, report }
