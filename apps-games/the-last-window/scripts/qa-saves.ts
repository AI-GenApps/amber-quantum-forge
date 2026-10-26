import {
  CAMPAIGN_DAYS,
  DAYS,
  DECOR,
  defaultProfile,
  FRIENDSHIP_THRESHOLDS,
  type OptionKey,
  PROFILE_VERSION,
  type Profile,
  REGULARS,
  SCENES,
  type StarCount,
} from "@web-games/the-last-window-core";

export interface QaSave {
  file: string;
  title: string;
  profile: Profile;
}

function daysDone(through: number, stars: StarCount): Profile["daysDone"] {
  const out: Profile["daysDone"] = {};
  for (const day of DAYS.filter((entry) => entry.day <= through)) {
    out[day.day] = {
      stars,
      earned: day.customers * 12,
      served: day.customers,
      delighted: day.customers - 2,
    };
  }
  return out;
}

function level(fp: number): number {
  return FRIENDSHIP_THRESHOLDS.filter((threshold) => fp >= threshold).length;
}

function choicesThrough(
  regularId: number,
  scenesDone: number,
  option: OptionKey,
): Record<string, OptionKey> {
  const out: Record<string, OptionKey> = {};
  for (const scene of SCENES) {
    if (scene.regular === regularId && scene.index <= scenesDone && scene.choice !== undefined) {
      out[scene.choice.id] = option;
    }
  }
  return out;
}

function withRegulars(profile: Profile, throughDay: number, cap: number, option: OptionKey): void {
  for (const regular of REGULARS) {
    const visits = regular.visitDays.filter((day) => day <= throughDay).length;
    const fp = Math.min(8, visits * 2);
    const scenesDone = Math.max(0, Math.min(visits, level(fp), cap) - 1);
    profile.regulars[regular.id] = {
      fp,
      visits,
      scenesDone,
      choices: choicesThrough(regular.id, scenesDone, option),
      ending: null,
    };
  }
}

function diaryThrough(day: number): number[] {
  return DAYS.filter((entry) => entry.day <= day).map((entry) => entry.day);
}

export function buildQaSaves(): QaSave[] {
  const midgame = defaultProfile();
  midgame.coins = 700;
  midgame.day = 10;
  midgame.daysDone = daysDone(9, 2);
  midgame.owned = ["decor-1", "decor-2", "decor-3"];
  midgame.diary = diaryThrough(9);
  midgame.flags = { tutorial: true };
  withRegulars(midgame, 9, 5, "a");

  const backlog = defaultProfile();
  backlog.coins = 600;
  backlog.day = 13;
  backlog.daysDone = daysDone(12, 3);
  backlog.owned = DECOR.map((item) => item.id);
  backlog.diary = diaryThrough(12);
  backlog.flags = { tutorial: true };
  withRegulars(backlog, 12, 4, "a");
  for (const regular of REGULARS) {
    const row = backlog.regulars[regular.id];
    if (row !== undefined) row.fp = 8;
  }

  const finale = defaultProfile();
  finale.coins = 450;
  finale.day = CAMPAIGN_DAYS;
  finale.daysDone = daysDone(13, 3);
  finale.owned = DECOR.map((item) => item.id);
  finale.diary = diaryThrough(13);
  finale.flags = { tutorial: true };
  withRegulars(finale, 13, 4, "a");
  for (const regular of REGULARS) {
    const row = finale.regulars[regular.id];
    if (row !== undefined) row.fp = 8;
  }

  const complete = defaultProfile();
  complete.coins = 900;
  complete.day = CAMPAIGN_DAYS + 1;
  complete.daysDone = daysDone(CAMPAIGN_DAYS, 3);
  complete.owned = DECOR.map((item) => item.id);
  complete.diary = diaryThrough(CAMPAIGN_DAYS);
  complete.flags = { tutorial: true };
  for (const regular of REGULARS) {
    const option: OptionKey = regular.id % 2 === 1 ? "a" : "b";
    complete.regulars[regular.id] = {
      fp: 8,
      visits: 6,
      scenesDone: 5,
      choices: choicesThrough(regular.id, 5, option),
      ending: option,
    };
  }

  return [
    {
      file: "day10-shopping.json",
      title: "Day 10 with coins to spend and three decor items",
      profile: midgame,
    },
    {
      file: "day13-scene-backlog.json",
      title: "Day 13 next, every regular has scene 4 waiting (more than the evening cap)",
      profile: backlog,
    },
    {
      file: "day14-ready.json",
      title: "Day 14 (Lantern Night) next, all decor, scenes 1 to 3 read",
      profile: finale,
    },
    {
      file: "campaign-complete.json",
      title: "Campaign complete, Late Shifts open, all 16 endings split a/b",
      profile: complete,
    },
  ];
}

export function envelope(profile: Profile): string {
  return `${JSON.stringify({ v: PROFILE_VERSION, data: profile })}\n`;
}
