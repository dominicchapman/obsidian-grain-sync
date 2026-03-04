import { describe, it, expect, vi, afterEach } from "vitest";
import { computeAfterDatetime } from "../src/sync";

const NOW = new Date("2025-02-20T14:00:00Z");

describe("computeAfterDatetime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function withFakeTime(fn: () => void) {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    fn();
  }

  it("uses daysBack when lastSyncedAt is null (first sync)", () => {
    withFakeTime(() => {
      const result = computeAfterDatetime(7, null);
      expect(result).toBe(new Date("2025-02-13T00:00:00.000Z").toISOString());
    });
  });

  it("uses lastSyncedAt when it exists, ignoring daysBack", () => {
    withFakeTime(() => {
      const twoHoursAgo = "2025-02-20T12:00:00Z";
      expect(computeAfterDatetime(7, twoHoursAgo)).toBe(twoHoursAgo);

      const tenDaysAgo = "2025-02-10T10:00:00Z";
      expect(computeAfterDatetime(7, tenDaysAgo)).toBe(tenDaysAgo);
    });
  });

  it("uses today midnight when daysBack is 0 and no lastSyncedAt", () => {
    withFakeTime(() => {
      const result = computeAfterDatetime(0, null);
      expect(result).toBe(new Date("2025-02-20T00:00:00.000Z").toISOString());
    });
  });
});
