import { DateTime, IANAZone } from "luxon";

function assertZone(timezone: string) {
  if (!IANAZone.isValidZone(timezone)) throw new Error("Choose a valid IANA timezone.");
}

export function localDateAt(instant: Date, timezone: string): string {
  assertZone(timezone);
  const date = DateTime.fromJSDate(instant, { zone: timezone });
  const key = date.toISODate();
  if (!date.isValid || !key) throw new Error("Provide a valid instant.");
  return key;
}

// Half-open UTC boundaries; a calendar day may last 23 or 25 hours.
export function localDayBounds(localDate: string, timezone: string) {
  assertZone(timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error("Use a valid YYYY-MM-DD date.");
  const start = DateTime.fromISO(localDate, { zone: timezone }).startOf("day");
  if (!start.isValid || start.toISODate() !== localDate) throw new Error("Use a valid calendar date.");
  return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).toUTC().toJSDate() };
}
