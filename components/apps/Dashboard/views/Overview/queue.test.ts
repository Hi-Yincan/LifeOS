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
    expect(queue[0].isOverdue).toBe(true);
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

  it("keeps today's membership and host dates current after midnight", () => {
    const data = makeDemoData();

    data.memberships[0].renewal.cancelBy = "2026-10-18T00:00:00Z";
    data.servers[0].expiresAt = "2026-10-18T00:00:00Z";
    const queue = getOverviewQueue(data, "en");

    expect(queue.find(({ id }) => id === data.memberships[0].id)).toMatchObject(
      {
        at: "2026-10-18T00:00:00Z",
        isOverdue: false,
        timePrecision: "date",
      }
    );
    expect(queue.find(({ id }) => id === data.servers[0].id)).toMatchObject({
      at: "2026-10-18T00:00:00Z",
      isOverdue: false,
      timePrecision: "date",
    });
  });

  it("includes the last calendar day and excludes the thirtieth-day boundary", () => {
    const data = makeDemoData();
    const membership = data.memberships[0];
    const server = data.servers[0];

    data.memberships = [
      {
        ...membership,
        id: "last-day-membership",
        renewal: { ...membership.renewal, cancelBy: "2026-11-16T23:59:59Z" },
      },
      {
        ...membership,
        id: "boundary-membership",
        renewal: { ...membership.renewal, cancelBy: "2026-11-17T00:00:00Z" },
      },
    ];
    data.servers = [
      { ...server, expiresAt: "2026-11-16T23:59:59Z", id: "last-day-host" },
      { ...server, expiresAt: "2026-11-17T00:00:00Z", id: "boundary-host" },
    ];
    const queue = getOverviewQueue(data, "en");

    expect(queue.some(({ id }) => id === "last-day-membership")).toBe(true);
    expect(queue.some(({ id }) => id === "last-day-host")).toBe(true);
    expect(queue.some(({ id }) => id === "boundary-membership")).toBe(false);
    expect(queue.some(({ id }) => id === "boundary-host")).toBe(false);
  });
});
