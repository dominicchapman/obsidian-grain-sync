import { describe, it, expect } from "vitest";
import { toKebab, toFilename } from "../src/sanitize";

describe("toKebab", () => {
  it("converts simple text to kebab-case", () => {
    expect(toKebab("Sprint Review")).toBe("sprint-review");
  });

  it("strips illegal filename characters", () => {
    expect(toKebab('Meeting: Q1 "Review"')).toBe("meeting-q1-review");
  });

  it("collapses multiple spaces and dashes", () => {
    expect(toKebab("one   two---three")).toBe("one-two-three");
  });

  it("converts dots, underscores, and em/en dashes to hyphens", () => {
    expect(toKebab("hello.world_foo—bar–baz")).toBe("hello-world-foo-bar-baz");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toKebab(" -hello- ")).toBe("hello");
  });

  it("returns 'untitled' for empty string", () => {
    expect(toKebab("")).toBe("untitled");
  });

  it("returns 'untitled' for string of only illegal chars", () => {
    expect(toKebab(':"<>|')).toBe("untitled");
  });

  it("handles mixed-case unicode-adjacent text", () => {
    expect(toKebab("Axiom. Inc.   Fletch — Positioning Chat")).toBe(
      "axiom-inc-fletch-positioning-chat",
    );
  });
});

describe("toFilename", () => {
  it("produces date-prefixed kebab filename", () => {
    expect(toFilename("Sprint Review", "2026-02-19T10:00:00Z")).toBe(
      "20260219T1000-sprint-review.md",
    );
  });

  it("sanitizes title in filename", () => {
    expect(toFilename('Call: "Important"', "2026-02-19T14:30:00Z")).toBe(
      "20260219T1430-call-important.md",
    );
  });

  it("truncates long slugs at 180 characters", () => {
    const longTitle = "a ".repeat(200);
    const filename = toFilename(longTitle, "2026-01-01T09:00:00Z");
    // datePrefix is 13 chars (YYYYMMDDTHHmm), plus hyphen, plus .md = 18 overhead
    // slug should be at most 180
    const slug = filename.replace(/^\d{8}T\d{4}-/, "").replace(/\.md$/, "");
    expect(slug.length).toBeLessThanOrEqual(180);
  });

  it("handles invalid date gracefully", () => {
    expect(toFilename("Test", "not-a-date")).toBe("00000000T0000-test.md");
  });

  it("uses local time for date prefix", () => {
    // The date prefix uses local time via new Date() methods
    const filename = toFilename("Meeting", "2026-06-15T23:30:00Z");
    expect(filename).toMatch(/^\d{8}T\d{4}-meeting\.md$/);
  });
});
