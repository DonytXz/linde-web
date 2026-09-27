import type { components } from "./schema";
type S = components["schemas"];
export type Language = S["Language"];
export type Topic = S["Topic"];
export type User = S["User"];
export type Session = S["Session"];
export type Booking = S["Booking"];
export type Slot = S["Slot"];
export type Availability = S["Availability"];
export type Intake = S["IntakeInput"];
export type PaymentIntent = S["PaymentIntent"];
export type Lawyer = S["LawyerSummary"];
export type Mode = S["ConsultationMode"];
export type RegisterInput = S["RegisterRequest"];
export type CreateBooking = S["CreateBookingRequest"];
export type SavedIntake = S["SavedIntake"];
export type ProfilePatch = S["ProfilePatch"];
export interface Page<T> {
  data: T[];
  pagination: { nextCursor: string | null };
}
export interface AvailabilityQuery {
  topicId: string;
  durationMinutes: number;
  language: Language;
  consultationMode: Mode;
  from: string;
  to: string;
  timeZone: string;
}
export interface ClientApi {
  me(): Promise<User>;
  login(email: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  verify(token: string): Promise<void>;
  resend(email: string): Promise<void>;
  forgot(email: string): Promise<void>;
  reset(token: string, newPassword: string): Promise<void>;
  profile(input: ProfilePatch): Promise<User>;
  topics(): Promise<Topic[]>;
  topic(id: string): Promise<Topic>;
  lawyer(id: string): Promise<Lawyer>;
  availability(query: AvailabilityQuery): Promise<Availability>;
  createBooking(input: CreateBooking, key: string): Promise<Booking>;
  bookings(cursor?: string): Promise<Page<Booking>>;
  booking(id: string): Promise<Booking>;
  intake(id: string): Promise<SavedIntake>;
  saveIntake(id: string, input: Intake): Promise<void>;
  payment(id: string, version: number, key: string): Promise<PaymentIntent>;
  cancel(id: string, key: string): Promise<Booking>;
  simulatePayment?(id: string): Promise<Booking>;
}
