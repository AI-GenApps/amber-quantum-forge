import { FINAL_SCENE_GIFT, SCENE_GIFT, SCENES_PER_REGULAR } from "../constants";
import { resolveEnding } from "../story/player";
import type { Beat, Lean, OptionKey } from "../story/types";
import { issue, LIMITS } from "./issues";
import { fleschKincaidGrade, words } from "./readability";
import type { ContentBundle, ContentIssue, SceneDef } from "./types";

type Section = "main" | "reaction" | "ending";

interface BeatRef {
  beat: Beat;
  section: Section;
  index: number;
  where: string;
}

export function beatsOf(scene: SceneDef): BeatRef[] {
  const out: BeatRef[] = [];
  for (const [index, beat] of scene.beats.entries()) {
    out.push({ beat, section: "main", index, where: `${scene.id} beat ${index + 1}` });
  }
  for (const key of ["a", "b"] as const) {
    const reaction = scene.choice?.options[key]?.reaction ?? [];
    for (const [index, beat] of reaction.entries()) {
      const where = `${scene.id} reaction ${key}${index + 1}`;
      out.push({ beat, section: "reaction", index, where });
    }
    const ending = scene.endings?.[key]?.beats ?? [];
    for (const [index, beat] of ending.entries()) {
      out.push({ beat, section: "ending", index, where: `${scene.id} ending ${key}${index + 1}` });
    }
  }
  return out;
}

export function sceneText(scene: SceneDef): string {
  return beatsOf(scene)
    .map((ref) => ref.beat.text)
    .join(" ");
}

function validateShape(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const ids = new Set<string>();
  const regularIds = new Set(bundle.regulars.map((r) => r.id));
  if (bundle.scenes.length !== LIMITS.scenes) {
    issues.push(
      issue("SCENE_COUNT", "scenes", `expected ${LIMITS.scenes}, got ${bundle.scenes.length}`),
    );
  }
  for (const scene of bundle.scenes) {
    if (ids.has(scene.id)) issues.push(issue("SCENE_COUNT", scene.id, "duplicate scene id"));
    ids.add(scene.id);
    if (!regularIds.has(scene.regular)) {
      issues.push(issue("DANGLING_SCENE", scene.id, `unknown regular ${scene.regular}`));
    }
  }
  for (const regular of bundle.regulars) {
    const own = bundle.scenes.filter((s) => s.regular === regular.id);
    if (own.length !== SCENES_PER_REGULAR) {
      issues.push(
        issue("SCENE_COUNT", `regular ${regular.id}`, `expected 5 scenes, got ${own.length}`),
      );
    }
    for (let k = 1; k <= SCENES_PER_REGULAR; k++) {
      const scene = own.find((s) => s.index === k);
      if (scene === undefined) {
        issues.push(issue("DANGLING_SCENE", `regular ${regular.id}`, `scene ${k} is missing`));
        continue;
      }
      const wantNext = k === SCENES_PER_REGULAR ? null : `scene-${regular.id}-${k + 1}`;
      if (scene.next !== wantNext) {
        issues.push(
          issue(
            "DANGLING_SCENE",
            scene.id,
            `next is ${String(scene.next)}, want ${String(wantNext)}`,
          ),
        );
      } else if (wantNext !== null && !ids.has(wantNext)) {
        issues.push(issue("DANGLING_SCENE", scene.id, `next scene ${wantNext} does not exist`));
      }
      const wantGift = k === SCENES_PER_REGULAR ? FINAL_SCENE_GIFT : SCENE_GIFT;
      if (scene.gift !== wantGift) {
        issues.push(issue("SCENE_COUNT", scene.id, `gift ${scene.gift}, want ${wantGift}`));
      }
    }
  }
  return issues;
}

function validateBeats(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const scene of bundle.scenes) {
    if (scene.beats.length < LIMITS.minBeats || scene.beats.length > LIMITS.maxBeats) {
      issues.push(issue("BEAT_COUNT", scene.id, `${scene.beats.length} beats, want 6 to 9`));
    }
    const speakerOk = new Set([`regular-${scene.regular}`, "you", "narration"]);
    for (const ref of beatsOf(scene)) {
      const count = words(ref.beat.text).length;
      if (count > LIMITS.maxBeatWords) {
        issues.push(issue("BEAT_LENGTH", ref.where, `${count} words, want at most 25`));
      }
      if (!speakerOk.has(ref.beat.speaker)) {
        issues.push(issue("BAD_SPEAKER", ref.where, `speaker ${ref.beat.speaker}`));
      }
      const grade = fleschKincaidGrade(ref.beat.text);
      if (grade > LIMITS.maxBeatGrade) {
        issues.push(issue("READING_LEVEL", ref.where, `beat grade ${grade.toFixed(1)}`));
      }
    }
    const grade = fleschKincaidGrade(sceneText(scene));
    if (grade > LIMITS.maxSceneGrade) {
      issues.push(issue("READING_LEVEL", scene.id, `scene grade ${grade.toFixed(1)}`));
    }
    issues.push(...visibleCounts(scene));
  }
  return issues;
}

function visibleCounts(scene: SceneDef): ContentIssue[] {
  const refs = [...new Set(scene.beats.flatMap((b) => (b.guard ? [b.guard.choice] : [])))];
  const total = 2 ** refs.length;
  for (let mask = 0; mask < total; mask++) {
    const picks = new Map(
      refs.map((id, i) => [id, (mask >> i) & 1 ? "b" : "a"] as [string, OptionKey]),
    );
    const visible = scene.beats.filter(
      (b) => !b.guard || picks.get(b.guard.choice) === b.guard.option,
    );
    if (visible.length < LIMITS.minBeats || visible.length > LIMITS.maxBeats) {
      return [
        issue("BEAT_COUNT", scene.id, `${visible.length} visible beats on a path, want 6 to 9`),
      ];
    }
  }
  return [];
}

interface ChoiceSite {
  scene: SceneDef;
  afterBeat: number;
}

function choiceSites(bundle: ContentBundle): Map<string, ChoiceSite> {
  const sites = new Map<string, ChoiceSite>();
  for (const scene of bundle.scenes) {
    if (scene.choice !== undefined) {
      sites.set(scene.choice.id, { scene, afterBeat: scene.choice.afterBeat });
    }
  }
  return sites;
}

function guardIssue(site: ChoiceSite | undefined, scene: SceneDef, ref: BeatRef): string | null {
  const guard = ref.beat.guard;
  if (guard === undefined) return null;
  if (site === undefined) return `guard ${guard.choice} names no choice`;
  if (site.scene.regular !== scene.regular) return `guard ${guard.choice} is another regular's`;
  if (guard.option !== "a" && guard.option !== "b") return `guard option ${String(guard.option)}`;
  if (site.scene.index < scene.index) return null;
  if (site.scene.index > scene.index) return `guard ${guard.choice} is made later`;
  if (ref.section === "main" && ref.index < site.afterBeat)
    return `guard ${guard.choice} used before it is made`;
  return null;
}

function validateGuards(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const sites = choiceSites(bundle);
  for (const scene of bundle.scenes) {
    for (const ref of beatsOf(scene)) {
      const guard = ref.beat.guard;
      if (guard === undefined) continue;
      const problem = guardIssue(sites.get(guard.choice), scene, ref);
      if (problem !== null) issues.push(issue("DANGLING_GUARD", ref.where, problem));
    }
  }
  for (const regular of bundle.regulars) {
    const late = bundle.scenes.filter((s) => s.regular === regular.id && s.index >= 4);
    const reacts = late.some((s) => beatsOf(s).some((ref) => ref.beat.guard !== undefined));
    if (!reacts) {
      issues.push(
        issue("DANGLING_GUARD", `regular ${regular.id}`, "scene 4 or 5 never reacts to a choice"),
      );
    }
  }
  return issues;
}

function validateChoices(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const regular of bundle.regulars) {
    const own = bundle.scenes.filter((s) => s.regular === regular.id && s.choice !== undefined);
    total += own.length;
    if (own.length !== regular.choiceCount) {
      issues.push(
        issue(
          "BAD_CHOICE_COUNT",
          `regular ${regular.id}`,
          `${own.length} choices, want ${regular.choiceCount}`,
        ),
      );
    }
  }
  if (total !== LIMITS.choices) {
    issues.push(issue("BAD_CHOICE_COUNT", "choices", `${total} choices, want ${LIMITS.choices}`));
  }
  for (const scene of bundle.scenes) {
    const choice = scene.choice;
    if (choice === undefined) continue;
    if (scene.index === 1 || scene.index === SCENES_PER_REGULAR) {
      issues.push(issue("BAD_CHOICE_COUNT", scene.id, "choices belong in scenes 2 to 4"));
    }
    if (seen.has(choice.id))
      issues.push(issue("BAD_CHOICE_COUNT", scene.id, "duplicate choice id"));
    seen.add(choice.id);
    if (choice.afterBeat < 1 || choice.afterBeat > scene.beats.length) {
      issues.push(
        issue("BAD_CHOICE_COUNT", scene.id, `afterBeat ${choice.afterBeat} is outside the scene`),
      );
    }
    const keys = Object.keys(choice.options).sort().join(",");
    if (keys !== "a,b") issues.push(issue("BAD_CHOICE_COUNT", scene.id, `options are ${keys}`));
    for (const key of ["a", "b"] as const) {
      const option = choice.options[key];
      if (option === undefined) continue;
      if (option.lean !== key) {
        issues.push(issue("BAD_CHOICE_COUNT", scene.id, `option ${key} leans ${option.lean}`));
      }
      if (words(option.label).length > LIMITS.maxLabelWords || option.label.trim() === "") {
        issues.push(
          issue("BEAT_LENGTH", `${scene.id} option ${key}`, "label must be 1 to 8 words"),
        );
      }
      if (option.reaction.length !== LIMITS.reactionBeats) {
        issues.push(
          issue(
            "BAD_CHOICE_COUNT",
            `${scene.id} option ${key}`,
            `${option.reaction.length} reaction beats, want 2`,
          ),
        );
      }
    }
  }
  return issues;
}

function combinations(count: number): Lean[][] {
  const out: Lean[][] = [];
  for (let mask = 0; mask < 2 ** count; mask++) {
    out.push(Array.from({ length: count }, (_, i): Lean => ((mask >> i) & 1 ? "b" : "a")));
  }
  return out;
}

function validateEndings(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  let blocks = 0;
  for (const scene of bundle.scenes) {
    if (scene.index !== SCENES_PER_REGULAR) {
      if (scene.endings !== undefined)
        issues.push(issue("BAD_ENDING", scene.id, "only scene 5 holds endings"));
      continue;
    }
    const regular = bundle.regulars.find((r) => r.id === scene.regular);
    if (scene.endings === undefined) {
      issues.push(issue("BAD_ENDING", scene.id, "scene 5 has no endings"));
      continue;
    }
    for (const key of ["a", "b"] as const) {
      const block = scene.endings[key];
      if (block === undefined) {
        issues.push(issue("BAD_ENDING", scene.id, `ending ${key} is missing`));
        continue;
      }
      blocks += 1;
      const count = block.beats.length;
      if (count < LIMITS.minEndingBeats || count > LIMITS.maxEndingBeats) {
        issues.push(
          issue("BAD_ENDING", `${scene.id} ending ${key}`, `${count} beats, want 3 to 4`),
        );
      }
      if (regular !== undefined && block.title !== regular.endingTitles[key]) {
        issues.push(issue("BAD_ENDING", `${scene.id} ending ${key}`, `title ${block.title}`));
      }
    }
    const choices = bundle.scenes.filter(
      (s) => s.regular === scene.regular && s.choice !== undefined,
    );
    const results = new Set(combinations(choices.length).map((leans) => resolveEnding(leans)));
    if (!(results.has("a") && results.has("b"))) {
      issues.push(
        issue("BAD_ENDING", `regular ${scene.regular}`, "both endings must be reachable"),
      );
    }
  }
  if (blocks !== LIMITS.endings) {
    issues.push(issue("BAD_ENDING", "endings", `${blocks} ending blocks, want ${LIMITS.endings}`));
  }
  return issues;
}

export function validateScenes(bundle: ContentBundle): ContentIssue[] {
  return [
    ...validateShape(bundle),
    ...validateBeats(bundle),
    ...validateGuards(bundle),
    ...validateChoices(bundle),
    ...validateEndings(bundle),
  ];
}
