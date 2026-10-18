/* eslint-disable unicorn/no-null -- 无监测、无观测与零可用率是不同状态。 */
import { DEMO_NOW, makeDemoData } from "components/apps/Dashboard/fixtures";
import { type ServiceHealthHistory } from "components/apps/Dashboard/model";
import { summarizeHealthHistory } from "components/apps/Dashboard/views/Services/health";

const history = (days: ServiceHealthHistory["days"]): ServiceHealthHistory => ({
  days,
  expectedSamplesPerDay: 24,
});

test("health history covers exactly the previous 90 complete UTC days", () => {
  const summary = summarizeHealthHistory(
    history([
      { date: "2026-07-19", degraded: 0, down: 24, up: 0 },
      { date: "2026-07-20", degraded: 0, down: 0, up: 24 },
      { date: "2026-10-17", degraded: 0, down: 0, up: 24 },
      { date: "2026-10-18", degraded: 0, down: 24, up: 0 },
    ]),
    DEMO_NOW
  );

  expect(summary.days).toHaveLength(90);
  expect(summary.days[0].date).toBe("2026-07-20");
  expect(summary.days[89].date).toBe("2026-10-17");
  expect(summary.observed).toBe(48);
  expect(summary.uptimePercent).toBe(100);
  expect(summary.coveragePercent).toBeCloseTo((2 / 90) * 100);
  expect(
    summarizeHealthHistory(null, "2026-10-18T01:00:00+08:00").days[89].date
  ).toBe("2026-10-16");
});

test("uptime uses observed checks and partial healthy days stay gray", () => {
  const summary = summarizeHealthHistory(
    history([
      { date: "2026-10-15", degraded: 0, down: 0, up: 12 },
      { date: "2026-10-16", degraded: 6, down: 0, up: 18 },
      { date: "2026-10-17", degraded: 1, down: 5, up: 6 },
    ]),
    DEMO_NOW
  );

  expect(summary.observed).toBe(48);
  expect(summary.up).toBe(36);
  expect(summary.uptimePercent).toBe(75);
  expect(summary.days[87]).toMatchObject({
    expected: 24,
    observed: 12,
    state: "unknown",
  });
  expect(summary.days[88].state).toBe("degraded");
  expect(summary.days[89]).toMatchObject({ observed: 12, state: "down" });
  expect(summary.coveragePercent).toBeCloseTo((48 / 2160) * 100);
});

test("missing observations produce unknown uptime instead of zero or healthy days", () => {
  const missing = summarizeHealthHistory(history([]), DEMO_NOW);
  const unmonitored = summarizeHealthHistory(null, DEMO_NOW);

  expect(missing.uptimePercent).toBeNull();
  expect(missing.coveragePercent).toBe(0);
  expect(unmonitored.uptimePercent).toBeNull();
  expect(unmonitored.coveragePercent).toBeNull();
  expect(missing.days.every(({ state }) => state === "unknown")).toBe(true);
  const down = summarizeHealthHistory(
    history([{ date: "2026-10-17", degraded: 0, down: 24, up: 0 }]),
    DEMO_NOW
  );

  expect(down.uptimePercent).toBe(0);
});

test("malformed dates, duplicates and invalid sample counts fail explicitly", () => {
  const day = { date: "2026-10-17", degraded: 0, down: 0, up: 24 };

  expect(() => summarizeHealthHistory(history([day, day]), DEMO_NOW)).toThrow(
    "DUPLICATE_HEALTH_DATE"
  );
  expect(() =>
    summarizeHealthHistory(history([{ ...day, date: "2026-02-30" }]), DEMO_NOW)
  ).toThrow("INVALID_HEALTH_DATE");
  expect(() =>
    summarizeHealthHistory(history([{ ...day, up: 25 }]), DEMO_NOW)
  ).toThrow("INVALID_HEALTH_SAMPLE_COUNT");
  expect(() =>
    summarizeHealthHistory(history([{ ...day, down: -1 }]), DEMO_NOW)
  ).toThrow("INVALID_HEALTH_SAMPLE_COUNT");
  expect(() =>
    summarizeHealthHistory({ days: [], expectedSamplesPerDay: 0 }, DEMO_NOW)
  ).toThrow("INVALID_HEALTH_SAMPLE_COUNT");
  expect(() => summarizeHealthHistory(history([]), "invalid")).toThrow(
    "INVALID_HEALTH_CLOCK"
  );
});

test("sample drive has a reproducible 99.50 percent rate and notebook includes a partial gray day", () => {
  const data = makeDemoData();
  const drive = data.services.find(({ id }) => id === "demo-drive");
  const notebook = data.services.find(({ id }) => id === "demo-notebook");

  expect(summarizeHealthHistory(drive?.healthHistory, DEMO_NOW)).toMatchObject({
    coveragePercent: 100,
    expected: 129600,
    observed: 129600,
    up: 128952,
    uptimePercent: 99.5,
  });
  expect(
    summarizeHealthHistory(notebook?.healthHistory, DEMO_NOW).days[12]
  ).toMatchObject({
    date: "2026-08-01",
    expected: 1440,
    observed: 720,
    state: "unknown",
  });
});
