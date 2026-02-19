import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestUrl } from "obsidian";
import { fetchRecordings } from "../src/grain";

vi.stubGlobal("PLUGIN_VERSION", "0.1.0-test");

const mockRequestUrl = vi.mocked(requestUrl);

beforeEach(() => {
  mockRequestUrl.mockReset();
});

describe("fetchRecordings", () => {
  it("fetches a single page of recordings", async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: {
        recordings: [
          {
            id: "r1",
            title: "Call 1",
            url: "https://grain.com/r1",
            start_datetime: "2026-02-19T10:00:00Z",
            end_datetime: "2026-02-19T10:30:00Z",
            updated_at: "2026-02-19T11:00:00Z",
          },
        ],
        cursor: null,
      },
    } as never);

    const result = await fetchRecordings("token123");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");

    expect(mockRequestUrl).toHaveBeenCalledOnce();
    const call = mockRequestUrl.mock.calls[0][0] as Record<string, unknown>;
    expect(call.method).toBe("POST");
    expect((call.headers as Record<string, string>).Authorization).toBe("Bearer token123");
    expect((call.headers as Record<string, string>)["Public-Api-Version"]).toBe("2025-10-31");
  });

  it("paginates through multiple pages using cursor", async () => {
    mockRequestUrl
      .mockResolvedValueOnce({
        status: 200,
        json: {
          recordings: [{ id: "r1", title: "Call 1", url: "u", start_datetime: null, end_datetime: null, updated_at: null }],
          cursor: "page2",
        },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        json: {
          recordings: [{ id: "r2", title: "Call 2", url: "u", start_datetime: null, end_datetime: null, updated_at: null }],
          cursor: null,
        },
      } as never);

    const result = await fetchRecordings("tok");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("r1");
    expect(result[1].id).toBe("r2");
    expect(mockRequestUrl).toHaveBeenCalledTimes(2);

    const secondCallBody = JSON.parse(
      (mockRequestUrl.mock.calls[1][0] as Record<string, string>).body,
    );
    expect(secondCallBody.cursor).toBe("page2");
  });

  it("passes after_datetime filter when provided", async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: { recordings: [], cursor: null },
    } as never);

    await fetchRecordings("tok", "2026-02-19T00:00:00Z");

    const body = JSON.parse(
      (mockRequestUrl.mock.calls[0][0] as Record<string, string>).body,
    );
    expect(body.filter.after_datetime).toBe("2026-02-19T00:00:00Z");
  });

  it("throws on 401 with descriptive message", async () => {
    mockRequestUrl.mockResolvedValueOnce({ status: 401, json: {} } as never);
    await expect(fetchRecordings("bad-token")).rejects.toThrow("Invalid API token");
  });

  it("throws on 429 rate limit", async () => {
    mockRequestUrl.mockResolvedValueOnce({ status: 429, json: {} } as never);
    await expect(fetchRecordings("tok")).rejects.toThrow("Rate limited");
  });

  it("throws on 500 server error", async () => {
    mockRequestUrl.mockResolvedValueOnce({ status: 500, json: {} } as never);
    await expect(fetchRecordings("tok")).rejects.toThrow("Grain server error");
  });

  it("throws on invalid response shape", async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: { unexpected: "shape" },
    } as never);
    await expect(fetchRecordings("tok")).rejects.toThrow("Unexpected response format");
  });
});
