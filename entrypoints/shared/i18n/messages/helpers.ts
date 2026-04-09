import { enMessages } from "./en";
import type {
  MessageTree,
  UiMessageCatalog,
  UiMessageCatalogOverrides,
} from "../types";

function mergeMessageTree(
  base: MessageTree,
  overrides: UiMessageCatalogOverrides | undefined
): MessageTree {
  if (!overrides) {
    return base;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = merged[key];

    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      merged[key] = mergeMessageTree(
        baseValue as MessageTree,
        overrideValue as UiMessageCatalogOverrides
      );
      continue;
    }

    merged[key] = overrideValue;
  }

  return merged as MessageTree;
}

export function defineLocaleMessages(
  overrides: UiMessageCatalogOverrides
): UiMessageCatalog {
  return mergeMessageTree(enMessages, overrides) as UiMessageCatalog;
}