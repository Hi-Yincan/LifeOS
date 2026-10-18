/* eslint-disable unicorn/no-null -- 测试明确覆盖缺失值与零值的不同语义。 */
import { DEMO_NOW, makeDemoData } from "components/apps/Dashboard/fixtures";
import { type Membership } from "components/apps/Dashboard/model";
import { getChartGeometry } from "components/apps/Dashboard/shared/chart";
import {
  formatBytes,
  formatDate,
  formatMoney,
  formatNumber,
  percentage,
  safeExternalUrl,
} from "components/apps/Dashboard/shared/format";
import {
  summarizeMemberships,
  summarizeServices,
  sumMoneyByCurrency,
} from "components/apps/Dashboard/shared/summary";

describe("dashboard demonstration data", () => {
  it("creates independent nested records with a fixed clock", () => {
    const first = makeDemoData();
    const second = makeDemoData();
    const originalPoint = second.personal.health[0].points[0].value;
    const originalLabel = second.personal.checkups[0].items[0].label.en;

    first.memberships[0].payments[0].amount.minor = 999;
    first.personal.health[0].points[0].value = 999;
    first.personal.checkups[0].items[0].label.en = "Changed sample label";
    expect(second.memberships[0].payments[0].amount.minor).toBe(2500);
    expect(second.personal.health[0].points[0].value).toBe(originalPoint);
    expect(second.personal.checkups[0].items[0].label.en).toBe(originalLabel);
    expect(first.now).toBe(DEMO_NOW);
    expect(second.now).toBe(DEMO_NOW);
  });

  it("keeps source, measurement and current state distinct", () => {
    const data = makeDemoData();
    const stale = data.services.find(({ id }) => id === "demo-gallery");

    expect(stale).toMatchObject({
      fetchedAt: DEMO_NOW,
      freshness: "stale",
      health: "up",
      observedAt: "2026-10-18T06:00:00Z",
      sourceUpdatedAt: "2026-10-18T06:00:00Z",
    });
    expect(
      data.servers.some(
        ({ freshness, health }) => freshness === "fresh" && health === "down"
      )
    ).toBe(true);
    expect(
      data.servers.some(
        ({ freshness, health }) =>
          freshness === "unavailable" && health === "unknown"
      )
    ).toBe(true);
    data.personal.health.forEach(({ observedAt, points }) => {
      expect(
        points
          .filter(({ value }) => value !== null)
          .every(
            ({ at }) =>
              observedAt !== null && Date.parse(at) <= Date.parse(observedAt)
          )
      ).toBe(true);
    });
    expect(data.services.every(({ url }) => url === null)).toBe(true);
  });
});

describe("dashboard value formatting", () => {
  it("preserves zero and distinguishes missing or non-finite numbers", () => {
    expect(formatNumber(0, "en")).toBe("0");
    expect(formatNumber(null, "en")).toBe("—");
    expect(formatNumber(Number.NaN, "zh")).toBe("—");
    expect(formatBytes(0, "en")).toBe("0 B");
    expect(formatBytes(1024, "en")).toBe("1 KiB");
  });

  it("does not divide by a missing resource total", () => {
    expect(percentage(0, 100)).toBe(0);
    expect(percentage(10, 0)).toBeNull();
  });

  it("formats minor units with currency-specific scale", () => {
    expect(formatMoney({ currency: "USD", minor: 1234 }, "en")).toContain(
      "12.34"
    );
    expect(formatMoney({ currency: "JPY", minor: 1234 }, "en")).toContain(
      "1,234"
    );
    expect(formatMoney({ currency: "CNY", minor: 0 }, "zh")).toContain("0.00");
    expect(formatMoney(null, "en")).toBe("—");
    expect(formatMoney({ currency: "USD", minor: 1.5 }, "en")).toBe("—");
  });

  it("preserves every minor unit when displaying large safe integers", () => {
    expect(
      formatMoney({ currency: "CNY", minor: 9007199254740990 }, "zh")
    ).toContain("90,071,992,547,409.90");
    expect(
      formatMoney({ currency: "USD", minor: Number.MAX_SAFE_INTEGER }, "en")
    ).toContain("90,071,992,547,409.91");
    expect(
      formatMoney({ currency: "EUR", minor: 9007199254740899 }, "en")
    ).toContain("90,071,992,547,408.99");
    expect(
      formatMoney({ currency: "JPY", minor: Number.MAX_SAFE_INTEGER }, "en")
    ).toContain("9,007,199,254,740,991");
    expect(formatMoney({ currency: "USD", minor: 1 }, "en")).toContain("0.01");
  });

  it("rejects unsafe links", () => {
    // eslint-disable-next-line no-script-url -- 不执行该字符串，只检查拒绝危险协议。
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://user:secret@example.invalid")).toBeNull();
    expect(safeExternalUrl("not a URL")).toBeNull();
    expect(safeExternalUrl("https://example.invalid/path")).toBe(
      "https://example.invalid/path"
    );
  });

  it("keeps invalid dates visibly missing", () => {
    expect(formatDate("invalid", "en")).toBe("—");
    expect(formatDate(null, "zh")).toBe("—");
  });
});

describe("membership summaries", () => {
  it("groups currencies and rounds annual estimates only after accumulation", () => {
    const base = makeDemoData().memberships[0];
    const annual: Membership[] = [0, 1, 2].map((index) => ({
      ...base,
      amount: { currency: "CNY", minor: 100 },
      cycle: "yearly",
      id: `annual-${index}`,
      payments: [],
    }));
    const summary = summarizeMemberships(annual, DEMO_NOW);

    expect(summary.estimatedMonthly).toStrictEqual([
      { currency: "CNY", minor: 25 },
    ]);
    expect(summary.confirmedPayments).toStrictEqual([]);
    expect(
      sumMoneyByCurrency([
        { currency: "USD", minor: 100 },
        { currency: "CNY", minor: 100 },
        { currency: "USD", minor: 200 },
      ])
    ).toStrictEqual([
      { currency: "CNY", minor: 100 },
      { currency: "USD", minor: 300 },
    ]);
    expect(() =>
      sumMoneyByCurrency([
        { currency: "CNY", minor: Number.MAX_SAFE_INTEGER },
        { currency: "CNY", minor: 1 },
      ])
    ).toThrow("DEMO_MONEY_OVERFLOW");
  });

  it("keeps today's planned renewal visible and does not turn it into a payment", () => {
    const base = makeDemoData().memberships[0];
    const today = {
      ...base,
      payments: [],
      renewal: { ...base.renewal, nextAt: "2026-10-18T00:00:00Z" },
    };
    const overdue = {
      ...base,
      id: "overdue",
      renewal: { ...base.renewal, nextAt: "2026-10-17T00:00:00Z" },
    };
    const summary = summarizeMemberships([today, overdue], DEMO_NOW);

    expect(summary.upcoming.map(({ id }) => id)).toStrictEqual([today.id]);
    expect(summary.overdue.map(({ id }) => id)).toStrictEqual(["overdue"]);
    expect(today.payments).toStrictEqual([]);
  });

  it("does not confuse cancelled renewal with expired access", () => {
    const cancelled = makeDemoData().memberships.find(
      ({ id }) => id === "demo-design"
    ) as Membership;
    const summary = summarizeMemberships([cancelled], DEMO_NOW);

    expect(summary.activeCount).toBe(1);
    expect(summary.estimatedMonthly).toStrictEqual([]);
    expect(summary.upcoming).toStrictEqual([]);
    expect(summary.confirmedPayments).toStrictEqual([
      { currency: "CNY", minor: 6800 },
    ]);
  });
});

describe("chart geometry", () => {
  it("keeps null gaps disconnected while preserving zero and time spacing", () => {
    const result = getChartGeometry([
      { at: "2026-10-18T01:00:00Z", value: 0 },
      { at: "2026-10-18T02:00:00Z", value: null },
      { at: "2026-10-18T04:00:00Z", value: 2 },
      { at: "2026-10-18T05:00:00Z", value: 1 },
    ]);

    expect(result.min).toBe(0);
    expect(result.max).toBe(2);
    expect(
      result.segments.map((segment) => segment.map(({ value }) => value))
    ).toStrictEqual([[0], [2, 1]]);
    expect(result.segments[1][0].x).toBe(221);
  });

  it("handles empty and constant samples without inventing a trend", () => {
    expect(
      getChartGeometry([{ at: DEMO_NOW, value: null }]).segments
    ).toStrictEqual([]);
    expect(
      getChartGeometry([{ at: DEMO_NOW, value: 0 }]).segments[0][0]
    ).toMatchObject({ value: 0, x: 150, y: 40 });
  });

  it("orders chart samples without mutating the source and leaves non-finite gaps", () => {
    const points = [
      { at: "2026-10-18T03:00:00Z", value: 5 },
      { at: "2026-10-18T01:00:00Z", value: 0 },
      { at: "2026-10-18T02:00:00Z", value: Number.POSITIVE_INFINITY },
    ];
    const before = points.map((point) => ({ ...point }));
    const result = getChartGeometry(points);

    expect(
      result.segments.map((segment) => segment.map(({ value }) => value))
    ).toStrictEqual([[0], [5]]);
    expect(points).toStrictEqual(before);
  });
});

describe("service summaries", () => {
  it("separates unmonitored, pending, stale and unhealthy services", () => {
    const data = makeDemoData();
    const before = JSON.stringify(data.services);
    const summary = summarizeServices(data.services);

    expect(summary).toStrictEqual({
      attention: 1,
      healthy: 1,
      pending: 1,
      stale: 1,
      total: 6,
      unknown: 0,
      unmonitored: 1,
    });
    expect(JSON.stringify(data.services)).toBe(before);
  });
});
