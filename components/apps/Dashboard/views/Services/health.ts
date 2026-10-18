/* eslint-disable unicorn/no-null -- 无观测时可用率未知，不能使用零值。 */
import { type ServiceHealthHistory } from "components/apps/Dashboard/model";

export type HealthDayState = "degraded" | "down" | "unknown" | "up";
export type HealthDay = {
  date: string;
  degraded: number;
  down: number;
  expected: number;
  observed: number;
  state: HealthDayState;
  up: number;
};
export type HealthSummary = {
  coveragePercent: null | number;
  days: HealthDay[];
  expected: number;
  observed: number;
  up: number;
  uptimePercent: null | number;
};

const DAY = 86_400_000;
export const HEALTH_DAYS = 90;

export const summarizeHealthHistory = (
  history: null | ServiceHealthHistory | undefined,
  now: string
): HealthSummary => {
  const timestamp = Date.parse(now);

  if (!Number.isFinite(timestamp)) throw new Error("INVALID_HEALTH_CLOCK");

  const end = Math.floor(timestamp / DAY) * DAY;
  const expectedPerDay = history?.expectedSamplesPerDay || 0;

  if (
    history &&
    (!Number.isSafeInteger(expectedPerDay) ||
      expectedPerDay <= 0 ||
      !Number.isSafeInteger(expectedPerDay * HEALTH_DAYS))
  ) {
    throw new Error("INVALID_HEALTH_SAMPLE_COUNT");
  }
  const records = new Map<
    string,
    { degraded: number; down: number; up: number }
  >();

  history?.days.forEach(({ date, degraded, down, up }) => {
    const dateTimestamp = Date.parse(`${date}T00:00:00Z`);

    if (
      !Number.isFinite(dateTimestamp) ||
      new Date(dateTimestamp).toISOString().slice(0, 10) !== date
    ) {
      throw new Error("INVALID_HEALTH_DATE");
    }
    if (records.has(date)) throw new Error("DUPLICATE_HEALTH_DATE");
    if (
      ![degraded, down, up].every(
        (value) => Number.isSafeInteger(value) && value >= 0
      ) ||
      up + degraded + down > expectedPerDay
    ) {
      throw new Error("INVALID_HEALTH_SAMPLE_COUNT");
    }
    records.set(date, { degraded, down, up });
  });

  const days = Array.from({ length: HEALTH_DAYS }, (_, index): HealthDay => {
    const date = new Date(end - (HEALTH_DAYS - index) * DAY)
      .toISOString()
      .slice(0, 10);
    const counts = records.get(date) || { degraded: 0, down: 0, up: 0 };
    const observed = counts.up + counts.degraded + counts.down;
    let state: HealthDayState = "unknown";

    if (counts.down > 0) state = "down";
    else if (counts.degraded > 0) state = "degraded";
    else if (observed > 0 && observed === expectedPerDay) state = "up";
    return { ...counts, date, expected: expectedPerDay, observed, state };
  });
  const expected = expectedPerDay * HEALTH_DAYS;
  const observed = days.reduce((sum, day) => sum + day.observed, 0);
  const up = days.reduce((sum, day) => sum + day.up, 0);

  return {
    coveragePercent: expected > 0 ? (observed / expected) * 100 : null,
    days,
    expected,
    observed,
    up,
    uptimePercent: observed > 0 ? (up / observed) * 100 : null,
  };
};
