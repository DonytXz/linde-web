import { describe, expect, it } from "vitest";
import { money, safeReturnPath } from "./format";
import { swapLanguage } from "./routes";

describe("cross-locale amounts and navigation", () => {
  it("uses the currency minor-unit scale, including zero and three decimals", () => {
    expect(money(1234, "jpy", "en")).toContain("1,234");
    expect(money(1234, "kwd", "en")).toContain("1.234");
    expect(money(1234, "usd", "en")).toContain("12.34");
  });
  it("translates appointment subroutes while preserving the booking identifier", () => {
    expect(swapLanguage("/es/citas/booking-123/pago", "en")).toBe(
      "/en/booking/booking-123/payment",
    );
    expect(swapLanguage("/en/booking/booking-123/confirmation", "es")).toBe(
      "/es/citas/booking-123/confirmacion",
    );
  });
  it("rejects external and backslash return URLs", () => {
    expect(safeReturnPath("//evil.example/path", "/en/appointments")).toBe(
      "/en/appointments",
    );
    expect(safeReturnPath("/en/\\evil.example", "/en/appointments")).toBe(
      "/en/appointments",
    );
    expect(safeReturnPath("/en/book?service=family", "/en/appointments")).toBe(
      "/en/book?service=family",
    );
  });
});
