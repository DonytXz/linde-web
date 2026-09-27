import type {
  AvailabilityQuery,
  Booking,
  ClientApi,
  Page,
  Session,
} from "./types";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 0,
    public fields: { field: string; code: string; message: string }[] = [],
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export function createHttpApi(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
): ClientApi {
  let csrfToken: string | undefined;
  let csrfPromise: Promise<void> | undefined;
  const base = baseUrl.replace(/\/$/, "");
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
  ): Promise<T> {
    if (!base) throw new ApiError("NOT_CONFIGURED", 503);
    if (method !== "GET" && !csrfToken) {
      csrfPromise ??= request<{ csrfToken: string }>("/csrf")
        .then((value) => {
          csrfToken = value.csrfToken;
        })
        .finally(() => {
          csrfPromise = undefined;
        });
      await csrfPromise;
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
    if (key) headers["Idempotency-Key"] = key;
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, {
        method,
        credentials: "include",
        cache: "no-store",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new ApiError("CONNECTION_FAILED", 503);
    }
    if (response.status === 204) return undefined as T;
    let payload: {
      data?: T;
      pagination?: Page<Booking>["pagination"];
      error?: { code?: string; fieldErrors?: ApiError["fields"] };
    };
    try {
      payload = await response.json();
    } catch {
      throw new ApiError("INVALID_RESPONSE", response.status);
    }
    if (!response.ok) {
      if (response.status === 401 || payload.error?.code === "CSRF_INVALID")
        csrfToken = undefined;
      throw new ApiError(
        payload.error?.code || `HTTP_${response.status}`,
        response.status,
        payload.error?.fieldErrors,
      );
    }
    if (payload.pagination) return payload as T;
    return payload.data as T;
  }
  return {
    me: () => request("/me"),
    login: async (email, password) => {
      const session = await request<Session>("/auth/login", "POST", {
        email,
        password,
      });
      csrfToken = session.csrfToken;
      return session;
    },
    logout: async () => {
      await request("/auth/logout", "POST", {});
      csrfToken = undefined;
    },
    register: (input) => request("/auth/register", "POST", input),
    verify: (token) => request("/auth/verify-email", "POST", { token }),
    resend: (email) => request("/auth/resend-verification", "POST", { email }),
    forgot: (email) => request("/auth/forgot-password", "POST", { email }),
    reset: async (token, newPassword) => {
      await request("/auth/reset-password", "POST", { token, newPassword });
      csrfToken = undefined;
    },
    profile: (input) => request("/me", "PATCH", input),
    topics: async () => {
      const result: import("./types").Topic[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < 20; page++) {
        const response: Page<import("./types").Topic> = await request(
          `/topics?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        );
        result.push(...response.data);
        cursor = response.pagination.nextCursor;
        if (!cursor) return result;
      }
      throw new ApiError("CATALOGUE_TOO_LARGE", 503);
    },
    topic: (id) => request(`/topics/${encodeURIComponent(id)}`),
    lawyer: (id) => request(`/lawyers/${encodeURIComponent(id)}`),
    availability: (query: AvailabilityQuery) =>
      request(
        `/availability?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`,
      ),
    createBooking: (input, key) => request("/bookings", "POST", input, key),
    bookings: (cursor) =>
      request(
        `/bookings?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    booking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
    intake: (id) => request(`/bookings/${encodeURIComponent(id)}/intake`),
    saveIntake: (id, input) =>
      request(`/bookings/${encodeURIComponent(id)}/intake`, "PUT", input),
    payment: (id, bookingVersion, key) =>
      request(
        `/bookings/${encodeURIComponent(id)}/payment-intents`,
        "POST",
        { bookingVersion },
        key,
      ),
    cancel: (id, key) =>
      request(`/bookings/${encodeURIComponent(id)}/cancel`, "POST", {}, key),
  };
}
