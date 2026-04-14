import { describe, expect, test } from "vitest";

import { enforceMeetingHistoryRetentionPolicy } from "../../entrypoints/background/history-db";

describe("History DB retention off contract", () => {
  test("HDBRET-001: off short-circuits all automatic archive pruning", async () => {
    await expect(
      enforceMeetingHistoryRetentionPolicy(0)
    ).resolves.toEqual({
      deletedSessionIds: [],
    });
  });
});
