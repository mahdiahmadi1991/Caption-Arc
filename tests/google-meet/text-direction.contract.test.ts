import { describe, expect, test } from "vitest";
import {
  DYNAMIC_TEXT_STYLE,
  getDynamicTextDirection,
} from "../../entrypoints/shared/text-direction";

describe("Dynamic text direction contracts", () => {
  test("TEXT-DIR-001: empty content does not force a direction", () => {
    expect(getDynamicTextDirection("")).toBeUndefined();
    expect(getDynamicTextDirection("   ")).toBeUndefined();
    expect(getDynamicTextDirection(undefined)).toBeUndefined();
  });

  test("TEXT-DIR-002: English and infrastructure-style values resolve to ltr", () => {
    expect(getDynamicTextDirection("Profile Alpha")).toBe("ltr");
    expect(getDynamicTextDirection("device-01 / Workspace East")).toBe("ltr");
    expect(getDynamicTextDirection("sk-proj-1234567890")).toBe("ltr");
  });

  test("TEXT-DIR-003: Persian content resolves to rtl", () => {
    expect(getDynamicTextDirection("پروفایل پیش‌فرض")).toBe("rtl");
    expect(getDynamicTextDirection("خلاصه جلسه آماده است")).toBe("rtl");
  });

  test("TEXT-DIR-004: dynamic text style preserves aggressive wrapping for mixed content", () => {
    expect(DYNAMIC_TEXT_STYLE).toEqual({
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    });
  });
});
