import { describe, expect, it } from "vitest";
import { localDateAt, localDayBounds } from "../../src/shared/time/calendar";

describe("canonical timezone calendar", () => {
  it("changes local date at Kolkata midnight independently of host timezone", () => {
    expect(localDateAt(new Date("2026-10-13T18:29:59Z"), "Asia/Kolkata")).toBe("2026-10-13");
    expect(localDateAt(new Date("2026-10-13T18:30:00Z"), "Asia/Kolkata")).toBe("2026-10-14");
  });
  it.each([["2026-03-08", 23], ["2026-11-01", 25]])("uses calendar boundaries for DST date %s", (day, hours) => {
    const { start, end } = localDayBounds(day, "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(hours);
    expect(localDateAt(start, "America/New_York")).toBe(day);
    expect(localDateAt(new Date(end.getTime() - 1), "America/New_York")).toBe(day);
  });
  it("rejects malformed and impossible dates", () => {
    expect(() => localDayBounds("2026-02-30", "Asia/Kolkata")).toThrow();
    expect(() => localDayBounds("2026-1-3", "Asia/Kolkata")).toThrow();
  });
  it("rejects invalid instants and timezone identifiers", () => {
    expect(() => localDateAt(new Date("invalid"), "Asia/Kolkata")).toThrow();
    expect(() => localDateAt(new Date(), "Invalid/Zone")).toThrow();
  });
});
