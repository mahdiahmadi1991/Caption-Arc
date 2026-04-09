import type { Settings } from "../types";
import {
  DEFAULT_CUSTOM_PROMPT,
  createDefaultSettings,
} from "../../shared/settings-defaults";

export const MODELS = [
  "gpt-5-mini",
  "gpt-5.2",
  "gpt-5.1",
  "gpt-5-nano",
  "gpt-4.1",
  "gpt-4.1-mini",
] as const;

export { DEFAULT_CUSTOM_PROMPT };

export const DEFAULT_SETTINGS: Settings = createDefaultSettings();
