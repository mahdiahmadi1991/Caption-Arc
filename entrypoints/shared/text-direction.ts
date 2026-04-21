import { detectTextDirection } from "./language-metadata";

export const DYNAMIC_TEXT_STYLE = {
  overflowWrap: "anywhere" as const,
  wordBreak: "break-word" as const,
};

export function getDynamicTextDirection(
  text?: string | null
): "ltr" | "rtl" | undefined {
  const normalized = text?.trim() ?? "";
  if (!normalized) {
    return undefined;
  }

  return detectTextDirection(normalized);
}
