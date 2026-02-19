import { requestUrl } from "obsidian";
import * as v from "valibot";
import {
  RecordingsResponseSchema,
  RecordingDetailResponseSchema,
  TranscriptResponseSchema,
} from "./schemas";
import type { GrainRecordingDetail, GrainTranscriptEntry } from "./note";

const API_BASE = "https://api.grain.com/_/public-api/v2";
const API_VERSION = "2025-10-31";

export interface GrainRecording {
  id: string;
  title: string;
  url: string;
  start_datetime: string | null;
  end_datetime: string | null;
  updated_at: string | null;
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Public-Api-Version": API_VERSION,
    "User-Agent": `ObsidianGrainSync/${PLUGIN_VERSION}`,
  };
}

function mapHttpError(status: number): string {
  switch (status) {
    case 401:
      return "Invalid API token. Check your token in settings.";
    case 403:
      return "Access denied. Your token may lack the required permissions.";
    case 429:
      return "Rate limited. Try again in a minute.";
    default:
      if (status >= 500) return `Grain server error (${status}). Try again later.`;
      return `Grain API error (${status}).`;
  }
}

export async function fetchRecordings(
  token: string,
  afterDatetime?: string,
): Promise<GrainRecording[]> {
  const all: GrainRecording[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {};
    if (afterDatetime) {
      body.filter = { after_datetime: afterDatetime };
    }
    if (cursor) {
      body.cursor = cursor;
    }

    const response = await requestUrl({
      url: `${API_BASE}/recordings`,
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
      throw: false,
    });

    if (response.status !== 200) {
      throw new Error(mapHttpError(response.status));
    }

    const parsed = v.safeParse(RecordingsResponseSchema, response.json);
    if (!parsed.success) {
      console.error("[Grain Sync] Invalid recordings response:", parsed.issues);
      throw new Error("Unexpected response format from Grain API.");
    }

    all.push(...(parsed.output.recordings as GrainRecording[]));
    cursor = parsed.output.cursor ?? undefined;
  } while (cursor);

  return all;
}

export async function fetchRecordingDetail(
  token: string,
  recordingId: string,
): Promise<GrainRecordingDetail> {
  const response = await requestUrl({
    url: `${API_BASE}/recordings/${recordingId}`,
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ include: { participants: true } }),
    throw: false,
  });

  if (response.status !== 200) {
    throw new Error(mapHttpError(response.status));
  }

  const parsed = v.safeParse(RecordingDetailResponseSchema, response.json);
  if (!parsed.success) {
    console.error("[Grain Sync] Invalid recording detail response:", parsed.issues);
    throw new Error("Unexpected response format from Grain API.");
  }

  const data = parsed.output;
  return {
    id: data.id,
    title: data.title,
    url: data.url,
    start_datetime: data.start_datetime ?? "",
    end_datetime: data.end_datetime ?? "",
    updated_at: data.updated_at ?? "",
    participants: (data.participants ?? []).map((p) => ({
      name: p.name ?? null,
      email: p.email ?? null,
    })),
  };
}

export async function fetchTranscript(
  token: string,
  recordingId: string,
): Promise<GrainTranscriptEntry[]> {
  const response = await requestUrl({
    url: `${API_BASE}/recordings/${recordingId}/transcript`,
    method: "GET",
    headers: headers(token),
    throw: false,
  });

  if (response.status !== 200) {
    throw new Error(mapHttpError(response.status));
  }

  const parsed = v.safeParse(TranscriptResponseSchema, response.json);
  if (!parsed.success) {
    console.error("[Grain Sync] Invalid transcript response:", parsed.issues);
    throw new Error("Unexpected response format from Grain API.");
  }

  return parsed.output;
}
