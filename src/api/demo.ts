// LINDE_DEVELOPMENT_FIXTURES_ONLY — this module must never enter production output.
import type {
  Booking,
  ClientApi,
  CreateBooking,
  Intake,
  SavedIntake,
  Slot,
  Topic,
  User,
} from "./types";
import { ApiError } from "./http";

const now = () => new Date().toISOString();
const catalogue: Topic[] = [
  {
    id: "immigration",
    slug: "immigration",
    name: { es: "Orientación migratoria", en: "Immigration guidance" },
    description: {
      es: "Pon en orden tus preguntas y conversa sobre las opciones que corresponden a tu situación.",
      en: "Make sense of your questions and discuss the options relevant to your circumstances.",
    },
  },
  {
    id: "family",
    slug: "family",
    name: { es: "Familia y residencia", en: "Family & residency" },
    description: {
      es: "Una conversación sobre tu familia, tus planes de residencia y los siguientes pasos.",
      en: "A conversation about your family, residency plans, and possible next steps.",
    },
  },
  {
    id: "work",
    slug: "work",
    name: { es: "Trabajo y movilidad", en: "Work & mobility" },
    description: {
      es: "Explora las preguntas legales que acompañan una nueva oportunidad profesional.",
      en: "Explore the legal questions that come with a new professional opportunity.",
    },
  },
  {
    id: "consultation",
    slug: "consultation",
    name: { es: "Consulta legal inicial", en: "Initial legal consultation" },
    description: {
      es: "Si no sabes por dónde empezar, una primera conversación puede ayudarte a ordenar el camino.",
      en: "If you are unsure where to begin, a first conversation can help you find your bearings.",
    },
  },
].map((topic) => ({
  ...topic,
  jurisdictions: ["Demonstration only"],
  durationMinutesOptions: [30, 60],
  languages: ["es", "en"],
  consultationModes: ["video", "phone"],
  prices: [
    { durationMinutes: 30, price: { amount: 9000, currency: "usd" } },
    { durationMinutes: 60, price: { amount: 15000, currency: "usd" } },
  ],
  active: true,
}));

interface State {
  version: 1;
  signedIn: boolean;
  bookings: Booking[];
  intake: Record<string, SavedIntake>;
  requests: Record<string, { input: string; bookingId: string }>;
}
const storageKey = "linde:demo:v1";
const initial = (): State => ({
  version: 1,
  signedIn: false,
  bookings: [],
  intake: {},
  requests: {},
});
function load(): State {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (value?.version === 1 && Array.isArray(value.bookings)) return value;
  } catch {
    /* Broken demo state resets safely. */
  }
  return initial();
}
const state = load();
const save = () => sessionStorage.setItem(storageKey, JSON.stringify(state));
const user: User = {
  id: "demo-client",
  email: "alex@example.test",
  emailVerified: true,
  givenName: "Alex",
  familyName: "Demo",
  phone: null,
  preferredLanguage: "es",
  timeZone: "Etc/UTC",
  role: "client",
  createdAt: now(),
  updatedAt: now(),
};
const requireUser = () => {
  if (!state.signedIn) throw new ApiError("UNAUTHENTICATED", 401);
};
function ownBooking(id: string): Booking {
  requireUser();
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) throw new ApiError("NOT_FOUND", 404);
  if (
    booking.status === "pendingPayment" &&
    booking.holdExpiresAt &&
    Date.parse(booking.holdExpiresAt) <= Date.now()
  ) {
    booking.status = "expired";
    booking.version++;
    save();
  }
  return booking;
}
const respond = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return structuredClone(value);
};

export const demoApi: ClientApi = {
  me: async () => {
    requireUser();
    return respond(user);
  },
  login: async () => {
    state.signedIn = true;
    save();
    return respond({
      user,
      csrfToken: "demo-only",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  },
  logout: async () => {
    state.signedIn = false;
    save();
  },
  register: async () => {
    await respond(null);
  },
  verify: async (token) => {
    if (!token) throw new ApiError("TOKEN_INVALID", 422);
    await respond(null);
  },
  resend: async () => {
    await respond(null);
  },
  forgot: async () => {
    await respond(null);
  },
  reset: async (token) => {
    if (!token) throw new ApiError("TOKEN_INVALID", 422);
    state.signedIn = false;
    save();
  },
  profile: async (input) => {
    requireUser();
    Object.assign(user, input);
    return respond(user);
  },
  topics: () => respond(catalogue),
  topic: async (id) => {
    const topic = catalogue.find((item) => item.id === id);
    if (!topic) throw new ApiError("NOT_FOUND", 404);
    return respond(topic);
  },
  lawyer: (id) =>
    respond({
      id,
      displayName: "Equipo de muestra / Sample team",
      professionalTitle: "Demonstration profile",
      credentials: [],
      languages: ["es", "en"],
      topicIds: catalogue.map((item) => item.id),
      consultationModes: ["video", "phone"],
    }),
  availability: async (query) => {
    const slots: Slot[] = [];
    const date = new Date(query.from);
    date.setUTCHours(0, 0, 0, 0);
    const topic = catalogue.find((item) => item.id === query.topicId);
    if (
      !topic ||
      !topic.languages.includes(query.language) ||
      !topic.consultationModes.includes(query.consultationMode)
    )
      throw new ApiError("INVALID_SERVICE", 422);
    for (let day = 0; day < 7; day++) {
      for (const hour of [10, 13, 16, 19]) {
        const start = new Date(date);
        start.setUTCDate(start.getUTCDate() + day);
        start.setUTCHours(hour);
        if (
          start.getTime() < Date.now() + 3600000 ||
          start.getTime() >= Date.parse(query.to)
        )
          continue;
        const startAt = start.toISOString();
        const endAt = new Date(
          start.getTime() + query.durationMinutes * 60000,
        ).toISOString();
        if (
          state.bookings.some(
            (item) =>
              (item.status === "confirmed" ||
                (item.status === "pendingPayment" &&
                  Date.parse(item.holdExpiresAt || "") > Date.now())) &&
              item.startAt < endAt &&
              item.endAt > startAt,
          )
        )
          continue;
        slots.push({
          id: `${query.topicId}|${query.durationMinutes}|${query.language}|${query.consultationMode}|${startAt}`,
          lawyerId: "demo-lawyer",
          topicId: query.topicId,
          durationMinutes: query.durationMinutes,
          startAt,
          endAt,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        });
      }
    }
    return respond({ slots, timeZone: query.timeZone, generatedAt: now() });
  },
  createBooking: async (input: CreateBooking, key) => {
    requireUser();
    if (state.requests[key]) {
      if (state.requests[key].input !== JSON.stringify(input))
        throw new ApiError("IDEMPOTENCY_CONFLICT", 409);
      return respond(ownBooking(state.requests[key].bookingId));
    }
    const [topicId, duration, language, mode, startAt] =
      input.slotId.split("|");
    if (
      topicId !== input.topicId ||
      Number(duration) !== input.durationMinutes ||
      language !== input.language ||
      mode !== input.consultationMode ||
      !Number.isFinite(Date.parse(startAt)) ||
      Date.parse(startAt) <= Date.now()
    )
      throw new ApiError("SLOT_UNAVAILABLE", 409);
    const endAt = new Date(
      Date.parse(startAt) + input.durationMinutes * 60000,
    ).toISOString();
    if (
      state.bookings.some(
        (item) =>
          (item.status === "confirmed" ||
            (item.status === "pendingPayment" &&
              Date.parse(item.holdExpiresAt || "") > Date.now())) &&
          item.startAt < endAt &&
          item.endAt > startAt,
      )
    )
      throw new ApiError("SLOT_UNAVAILABLE", 409);
    const price = catalogue
      .find((item) => item.id === topicId)
      ?.prices.find(
        (item) => item.durationMinutes === input.durationMinutes,
      )?.price;
    if (!price) throw new ApiError("INVALID_SERVICE", 422);
    const expiry = new Date(Date.now() + 15 * 60000).toISOString();
    const booking: Booking = {
      id: crypto.randomUUID(),
      clientId: user.id,
      lawyerId: "demo-lawyer",
      topicId,
      startAt,
      endAt,
      timeZone: input.timeZone,
      language: input.language,
      consultationMode: input.consultationMode,
      status: "pendingPayment",
      paymentStatus: "unpaid",
      refundStatus: "none",
      holdExpiresAt: expiry,
      quote: {
        subtotal: price.amount,
        tax: 0,
        total: price.amount,
        currency: price.currency,
        pricingVersion: "demo-v1",
        expiresAt: expiry,
      },
      intakeStatus: "notSubmitted",
      version: 1,
      createdAt: now(),
      updatedAt: now(),
      resolutionRequired: false,
    };
    state.bookings.unshift(booking);
    state.requests[key] = {
      input: JSON.stringify(input),
      bookingId: booking.id,
    };
    save();
    return respond(booking);
  },
  bookings: async () => {
    requireUser();
    state.bookings.forEach((item) => ownBooking(item.id));
    return respond({ data: state.bookings, pagination: { nextCursor: null } });
  },
  booking: (id) => respond(ownBooking(id)),
  intake: (id) => {
    ownBooking(id);
    return respond(state.intake[id] || null);
  },
  saveIntake: async (id: string, input: Intake) => {
    const booking = ownBooking(id);
    if (!["pendingPayment", "confirmed"].includes(booking.status))
      throw new ApiError("BOOKING_STATE_CONFLICT", 409);
    booking.intakeStatus = "submitted";
    booking.version++;
    state.intake[id] = {
      ...input,
      bookingId: id,
      submittedAt: now(),
      updatedAt: now(),
      bookingVersion: booking.version,
    };
    save();
  },
  payment: async () => {
    throw new ApiError("DEMO_PAYMENT_ONLY", 422);
  },
  cancel: async (id) => {
    const booking = ownBooking(id);
    if (!["pendingPayment", "confirmed", "cancelled"].includes(booking.status))
      throw new ApiError("BOOKING_STATE_CONFLICT", 409);
    booking.status = "cancelled";
    booking.holdExpiresAt = null;
    booking.version++;
    if (booking.paymentStatus === "succeeded") booking.refundStatus = "pending";
    save();
    return respond(booking);
  },
  simulatePayment: async (id) => {
    const booking = ownBooking(id);
    if (booking.status !== "pendingPayment")
      throw new ApiError("BOOKING_STATE_CONFLICT", 409);
    booking.status = "confirmed";
    booking.paymentStatus = "succeeded";
    booking.holdExpiresAt = null;
    booking.version++;
    save();
    return respond(booking);
  },
};
