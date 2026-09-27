import { describe, expect, it, vi } from "vitest";
import { ApiError, createHttpApi } from "./http";

describe("API boundary", () => {
  it("bootstraps CSRF and sends credentials and idempotency without bearer storage", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: { csrfToken: "csrf-example" } }),
      )
      .mockResolvedValueOnce(
        Response.json({ data: { id: "booking-example" } }),
      );
    const api = createHttpApi("https://api.example.test/v1", fetcher);
    await api.createBooking(
      {
        slotId: "slot-example",
        topicId: "topic-example",
        durationMinutes: 30,
        timeZone: "Etc/UTC",
        language: "en",
        consultationMode: "video",
      },
      "request-example",
    );
    expect(fetcher.mock.calls[0][0]).toBe("https://api.example.test/v1/csrf");
    expect(fetcher.mock.calls[1][1]).toMatchObject({
      credentials: "include",
      cache: "no-store",
      headers: {
        "X-CSRF-Token": "csrf-example",
        "Idempotency-Key": "request-example",
      },
    });
    expect(fetcher.mock.calls[1][1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  });
  it("preserves conflict semantics and does not blindly retry a reservation", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: { csrfToken: "csrf-example" } }),
      )
      .mockResolvedValueOnce(
        Response.json({ error: { code: "SLOT_UNAVAILABLE" } }, { status: 409 }),
      );
    const api = createHttpApi("/v1", fetcher);
    await expect(
      api.cancel("booking-example", "request-example"),
    ).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE", status: 409 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("does not make requests or return fixtures when production is unconfigured", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(createHttpApi("", fetcher).me()).rejects.toEqual(
      new ApiError("NOT_CONFIGURED", 503),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
