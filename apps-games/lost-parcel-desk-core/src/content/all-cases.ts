import type { CaseContent } from "./types";
import { CHAPTER_1 } from "./cases/chapter1";
import { CHAPTER_2 } from "./cases/chapter2";
import { CHAPTER_3 } from "./cases/chapter3";

export const CASES_ALL: readonly CaseContent[] = [...CHAPTER_1, ...CHAPTER_2, ...CHAPTER_3];
