import { toFilename } from "./sanitize";

export interface GrainParticipant {
  name: string | null;
  email: string | null;
}

export interface GrainRecordingDetail {
  id: string;
  title: string;
  url: string;
  start_datetime: string;
  end_datetime: string;
  updated_at: string;
  participants: GrainParticipant[];
}

export interface GrainTranscriptEntry {
  speaker: string;
  text: string;
  start: number; // milliseconds
  end: number;   // milliseconds
}

export function buildNote(
  recording: GrainRecordingDetail,
  transcript: GrainTranscriptEntry[],
): string {
  const speakers = new Set(transcript.map((e) => e.speaker));
  const activeSpeakers = recording.participants.filter(
    (p) => p.name && speakers.has(p.name),
  );
  const recordingWithActiveSpeakers = { ...recording, participants: activeSpeakers };

  const frontmatter = buildFrontmatter(recordingWithActiveSpeakers);
  const body = buildTranscript(transcript);
  return `${frontmatter}\n${body}`;
}

export function buildFrontmatter(recording: GrainRecordingDetail): string {
  const date = recording.start_datetime
    ? recording.start_datetime.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const people = toWikilinks(recording.participants);
  const peopleYaml =
    people.length === 0
      ? "people: []"
      : `people:\n${people.map((p) => `  - "${p}"`).join("\n")}`;

  return `---
categories:
  - "[[Meetings]]"
type:
  - recording
date: ${date}
org:
${peopleYaml}
topics: []
url: ${recording.url}
grain_id: ${recording.id}
updated: ${recording.updated_at}
---`;
}

export function buildTranscript(entries: GrainTranscriptEntry[]): string {
  if (entries.length === 0) return "";

  const blocks: string[] = [];
  let currentSpeaker: string | null = null;
  let currentTexts: string[] = [];
  let blockStartTime = 0;

  for (const entry of entries) {
    if (entry.speaker === currentSpeaker) {
      currentTexts.push(entry.text);
    } else {
      if (currentSpeaker !== null) {
        blocks.push(formatBlock(currentSpeaker, blockStartTime, currentTexts));
      }
      currentSpeaker = entry.speaker;
      blockStartTime = entry.start;
      currentTexts = [entry.text];
    }
  }

  if (currentSpeaker !== null) {
    blocks.push(formatBlock(currentSpeaker, blockStartTime, currentTexts));
  }

  return `## Transcript\n\n${blocks.join("\n\n")}\n`;
}

function formatBlock(
  speaker: string,
  startTime: number,
  texts: string[],
): string {
  return `**${speaker}** (${formatTimestamp(startTime)})\n\n${texts.join(" ")}`;
}

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function toWikilinks(participants: GrainParticipant[]): string[] {
  return participants
    .map((p) => p.name || p.email || null)
    .filter((name): name is string => name !== null)
    .map((name) => `[[${name}]]`);
}

export function buildPersonNote(name: string, date: string): string {
  return `---
categories:
  - "[[People]]"
birthday:
org: []
created: ${date}
---
## Meetings

![[Meetings.base#Person]]
`;
}

export { toFilename };
