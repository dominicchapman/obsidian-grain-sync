import * as v from "valibot";

export const ParticipantSchema = v.object({
  name: v.nullish(v.string()),
  email: v.nullish(v.string()),
});

export const RecordingSchema = v.object({
  id: v.string(),
  title: v.string(),
  url: v.string(),
  start_datetime: v.nullish(v.string()),
  end_datetime: v.nullish(v.string()),
  updated_at: v.nullish(v.string()),
});

export const RecordingsResponseSchema = v.object({
  recordings: v.array(RecordingSchema),
  cursor: v.nullish(v.string()),
});

export const RecordingDetailResponseSchema = v.object({
  ...RecordingSchema.entries,
  participants: v.optional(v.array(ParticipantSchema), []),
});

export const TranscriptEntrySchema = v.object({
  speaker: v.string(),
  text: v.string(),
  start: v.number(),
  end: v.number(),
  participant_id: v.optional(v.string()),
});

export const TranscriptResponseSchema = v.array(TranscriptEntrySchema);
