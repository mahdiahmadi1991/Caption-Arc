import type { Settings as BackgroundSettings } from "../../background/types";
import { createDefaultSettings } from "../../shared/settings-defaults";

export type Settings = BackgroundSettings;

export const DEFAULT_SETTINGS: Settings = createDefaultSettings();
