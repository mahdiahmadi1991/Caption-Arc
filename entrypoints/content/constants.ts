import { LANGUAGE_OPTIONS } from "../shared/language-metadata";
import { DEFAULT_CUSTOM_PROMPT } from "../shared/settings-defaults";

export const MAX_CAPTIONS = 200;
export const SEMANTIC_DELAY = 1500;
// TODO: Refining, Semantic, Optimistic has not been used yet. Consider refactor code
export const TranslationStatus = {
  Pending: "pending",
  Translating: "translating",
  Refining: "refining",
  Optimistic: "optimistic",
  Semantic: "semantic",
  Error: "error",
} as const;

export type TranslationStatus =
  (typeof TranslationStatus)[keyof typeof TranslationStatus];

export const LANGUAGES = LANGUAGE_OPTIONS;

export { DEFAULT_CUSTOM_PROMPT };
