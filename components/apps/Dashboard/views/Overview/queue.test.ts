import { describe, expect, it } from "@jest/globals";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { getOverviewQueue } from "components/apps/Dashboard/views/Overview/queue";

describe("overview action queue", () => {
  it("keeps cancelled renewals out while preserving active access", () => {
    const data = makeDemoData();
    const queue = getOverviewQueue(data, "en");

    expect(
      data.memberships.find(({ id }) => id === "demo-design")?.entitlement
        .status
    ).toBe("active");
    expect(queue.some(({ id }) => id === "demo-design")).toBe(false);
    expect(queue.find(({ id }) => id === "demo-study")?.at).toBe(
      "2026-10-19T00:00:00Z"
    );
    expect(queue.find(({ id }) => id === "demo-archive")?.at).toBeUndefined();
  });

  it("shows only future planned events in the seven-day window", () => {
    const data = makeDemoData();
    const event = data.personal.schedule[2];

    data.personal.schedule = [
      { ...event, id: "past", startsAt: "2026-10-18T11:59:00Z" },
      { ...event, id: "boundary", startsAt: "2026-10-25T12:00:00Z" },
      { ...event, id: "later", startsAt: "2026-10-25T12:00:01Z" },
      { ...event, id: "cancelled", status: "cancelled" },
    ];

    expect(
      getOverviewQueue(data, "en")
        .filter(({ kind }) => kind === "personal")
        .map(({ id }) => id)
    ).toEqual(["boundary"]);
  });

  it("preserves currency labels, unknown amounts and overdue dates without editing records", () => {
    const data = makeDemoData();

    data.memberships[0].renewal.cancelBy = "2026-10-17T00:00:00Z";
    const before = JSON.stringify(data);
    const queue = getOverviewQueue(data, "en");

    expect(queue[0].at).toBe("2026-10-17T00:00:00Z");
    expect(queue.find(({ id }) => id === "demo-cinema")?.detail).toContain(
      "CNY"
    );
    expect(queue.find(({ id }) => id === "demo-cloud")?.detail).toContain(
      "USD"
    );
    expect(queue.find(({ id }) => id === "demo-archive")?.detail).toContain(
      "Review"
    );
    expect(JSON.stringify(data)).toBe(before);
  });
});
