import { describe, it, expect } from "vitest";
import {
  buildNote,
  buildPersonNote,
  buildFrontmatter,
  buildTranscript,
  formatTimestamp,
  toWikilinks,
  type GrainRecordingDetail,
  type GrainTranscriptEntry,
  type GrainParticipant,
} from "../src/note";

const recording: GrainRecordingDetail = {
  id: "rec-abc123",
  title: "Sprint Review",
  url: "https://grain.com/share/recording/rec-abc123",
  start_datetime: "2026-02-19T10:00:00Z",
  end_datetime: "2026-02-19T10:30:00Z",
  updated_at: "2026-02-19T11:00:00Z",
  participants: [
    { name: "Alice Smith", email: "alice@example.com" },
    { name: "Bob Jones", email: "bob@example.com" },
  ],
};

const transcript: GrainTranscriptEntry[] = [
  { speaker: "Alice Smith", text: "Hey Bob, thanks for joining.", start: 0, end: 5000 },
  { speaker: "Alice Smith", text: "Let's get started.", start: 5000, end: 8000 },
  { speaker: "Bob Jones", text: "Thanks for having me.", start: 15000, end: 20000 },
  { speaker: "Alice Smith", text: "First item on the agenda.", start: 25000, end: 30000 },
];

describe("buildFrontmatter", () => {
  it("produces correct YAML with participants", () => {
    const fm = buildFrontmatter(recording);
    expect(fm).toContain("grain_id: rec-abc123");
    expect(fm).toContain("date: 2026-02-19");
    expect(fm).toContain('- "[[Alice Smith]]"');
    expect(fm).toContain('- "[[Bob Jones]]"');
    expect(fm).toContain("url: https://grain.com/share/recording/rec-abc123");
    expect(fm).toContain("updated: 2026-02-19T11:00:00Z");
    expect(fm).toContain('- "[[Meetings]]"');
    expect(fm).toContain("- recording");
    expect(fm).toMatch(/^---\n/);
    expect(fm).toMatch(/\n---$/);
  });

  it("produces empty people array when no participants", () => {
    const rec = { ...recording, participants: [] };
    const fm = buildFrontmatter(rec);
    expect(fm).toContain("people: []");
  });

  it("falls back to email when name is null", () => {
    const rec = {
      ...recording,
      participants: [{ name: null, email: "anon@example.com" }],
    };
    const fm = buildFrontmatter(rec);
    expect(fm).toContain('- "[[anon@example.com]]"');
  });
});

describe("buildTranscript", () => {
  it("merges consecutive same-speaker entries", () => {
    const result = buildTranscript(transcript);
    expect(result).toContain(
      "**Alice Smith** (0:00)\n\nHey Bob, thanks for joining. Let's get started.",
    );
  });

  it("separates different speakers into blocks", () => {
    const result = buildTranscript(transcript);
    expect(result).toContain("**Bob Jones** (0:15)\n\nThanks for having me.");
  });

  it("includes the section heading", () => {
    const result = buildTranscript(transcript);
    expect(result).toMatch(/^## Transcript\n/);
  });

  it("returns empty string for empty transcript", () => {
    expect(buildTranscript([])).toBe("");
  });

  it("handles a single entry", () => {
    const single: GrainTranscriptEntry[] = [{ speaker: "Alice", text: "Hello.", start: 0, end: 3000 }];
    const result = buildTranscript(single);
    expect(result).toContain("**Alice** (0:00)\n\nHello.");
  });
});

describe("formatTimestamp", () => {
  it("formats milliseconds as M:SS", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(5000)).toBe("0:05");
    expect(formatTimestamp(65000)).toBe("1:05");
    expect(formatTimestamp(599000)).toBe("9:59");
  });

  it("formats hours as H:MM:SS", () => {
    expect(formatTimestamp(3600000)).toBe("1:00:00");
    expect(formatTimestamp(3661000)).toBe("1:01:01");
    expect(formatTimestamp(7200000)).toBe("2:00:00");
  });
});

describe("toWikilinks", () => {
  it("creates wikilinks from participant names", () => {
    const participants: GrainParticipant[] = [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: null },
    ];
    expect(toWikilinks(participants)).toEqual(["[[Alice]]", "[[Bob]]"]);
  });

  it("falls back to email when name is null", () => {
    const participants: GrainParticipant[] = [{ name: null, email: "anon@co.com" }];
    expect(toWikilinks(participants)).toEqual(["[[anon@co.com]]"]);
  });

  it("filters out participants with no name or email", () => {
    const participants: GrainParticipant[] = [
      { name: "Alice", email: null },
      { name: null, email: null },
    ];
    expect(toWikilinks(participants)).toEqual(["[[Alice]]"]);
  });

  it("returns empty array for no participants", () => {
    expect(toWikilinks([])).toEqual([]);
  });
});

describe("buildNote", () => {
  it("composes frontmatter and transcript", () => {
    const note = buildNote(recording, transcript);
    expect(note).toMatch(/^---\n/);
    expect(note).toContain("## Transcript");
    expect(note).toContain("grain_id: rec-abc123");
    expect(note).toContain("**Alice Smith**");
  });

  it("handles recording with empty transcript", () => {
    const note = buildNote(recording, []);
    expect(note).toMatch(/^---\n/);
    expect(note).toContain("grain_id: rec-abc123");
    expect(note).not.toContain("## Transcript");
  });

  it("filters out participants who never spoke (notetaker bots)", () => {
    const rec: GrainRecordingDetail = {
      ...recording,
      participants: [
        { name: "Alice Smith", email: "alice@example.com" },
        { name: "Bob Jones", email: "bob@example.com" },
        { name: "Granola Notetaker", email: "bot@granola.ai" },
      ],
    };
    // Only Alice and Bob speak in the transcript
    const note = buildNote(rec, transcript);
    expect(note).toContain('- "[[Alice Smith]]"');
    expect(note).toContain('- "[[Bob Jones]]"');
    expect(note).not.toContain("Granola Notetaker");
  });

  it("produces empty people when no participants spoke", () => {
    const rec: GrainRecordingDetail = {
      ...recording,
      participants: [
        { name: "Silent Bot", email: "bot@example.com" },
      ],
    };
    const note = buildNote(rec, transcript);
    expect(note).toContain("people: []");
  });

  it("produces empty people with empty transcript", () => {
    const note = buildNote(recording, []);
    expect(note).toContain("people: []");
  });
});

describe("buildPersonNote", () => {
  it("produces People Template frontmatter with date", () => {
    const note = buildPersonNote("Alice Smith", "2026-02-19");
    expect(note).toContain('- "[[People]]"');
    expect(note).toContain("created: 2026-02-19");
    expect(note).toContain("birthday:");
    expect(note).toContain("org: []");
  });

  it("includes embedded meetings view", () => {
    const note = buildPersonNote("Alice Smith", "2026-02-19");
    expect(note).toContain("## Meetings");
    expect(note).toContain("![[Meetings.base#Person]]");
  });
});
