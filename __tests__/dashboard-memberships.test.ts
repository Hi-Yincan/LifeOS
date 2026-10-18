import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { type Membership } from "components/apps/Dashboard/model";
import {
  formatMoney,
  isValidMoney,
  summarizeMemberships,
} from "components/apps/Dashboard/shared";
import { filterMemberships } from "components/apps/Dashboard/views/Memberships/functions";

describe("会员金额展示与周期汇总", () => {
  it("区分未知金额与确定免费的权益", () => {
    const data = makeDemoData();
    const unknown = data.memberships.find(({ id }) => id === "demo-archive");
    const free = data.memberships.find(({ id }) => id === "demo-notes");

    if (!unknown || !free) throw new Error("Missing membership samples");
    expect(unknown.amount).toBeNull();
    expect(formatMoney(unknown.amount, "zh")).toBe("—");
    expect(free.amount).toStrictEqual({ currency: "CNY", minor: 0 });
    expect(formatMoney(free.amount, "zh")).toContain("0.00");
    const summary = summarizeMemberships([unknown, free], data.now);

    expect(summary).toMatchObject({
      activeCount: 1,
      confirmedPayments: [],
      estimatedMonthly: [],
      unknownAmountCount: 1,
    });
  });

  it.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
  ])("不会把非法或不安全的小单位金额 %s 展示为有效价格", (minor) => {
    const amount = { currency: "CNY" as const, minor };

    expect(isValidMoney(amount)).toBe(false);
    expect(formatMoney(amount, "zh")).toBe("—");
  });

  it("按原币汇总已付款与计划月均费用，保持年度和试用语义", () => {
    const data = makeDemoData();
    const before = JSON.stringify(data.memberships);
    const summary = summarizeMemberships(data.memberships, data.now);
    const trial = data.memberships.find(({ id }) => id === "demo-study");
    const annual = data.memberships.find(({ id }) => id === "demo-cloud");

    expect(summary).toMatchObject({
      activeCount: 5,
      confirmedPayments: [
        { currency: "CNY", minor: 9300 },
        { currency: "USD", minor: 12000 },
      ],
      estimatedMonthly: [
        { currency: "CNY", minor: 6400 },
        { currency: "USD", minor: 1000 },
      ],
      unknownAmountCount: 1,
    });
    expect(trial).toMatchObject({
      entitlement: { status: "trial" },
      payments: [],
    });
    expect(annual?.cycle).toBe("yearly");
    expect(JSON.stringify(data.memberships)).toBe(before);
  });
});

describe("会员权益与续费状态读取", () => {
  it("取消或暂停续费仍可保留有效权益，不产生未来账单或新付款", () => {
    const data = makeDemoData();
    const cancelled = data.memberships.find(({ id }) => id === "demo-design");
    const original = data.memberships[0];
    const paused: Membership = {
      ...original,
      id: "paused-renewal",
      payments: [],
      renewal: { ...original.renewal, status: "paused" },
    };

    if (!cancelled) throw new Error("Missing cancelled renewal sample");
    const before = JSON.stringify([cancelled, paused]);
    const summary = summarizeMemberships([cancelled, paused], data.now);

    expect(cancelled).toMatchObject({
      entitlement: { endsAt: "2026-10-28T00:00:00Z", status: "active" },
      renewal: { status: "cancelled" },
    });
    expect(paused.entitlement).toStrictEqual(original.entitlement);
    expect(summary).toMatchObject({
      activeCount: 2,
      confirmedPayments: [{ currency: "CNY", minor: 6800 }],
      estimatedMonthly: [],
      overdue: [],
      upcoming: [],
    });
    expect(JSON.stringify([cancelled, paused])).toBe(before);
  });

  it("一次性权益不按月摊入计划续费，也不把已有价格当作实付", () => {
    const data = makeDemoData();
    const oneTime: Membership = {
      ...data.memberships[0],
      amount: { currency: "USD", minor: 1999 },
      cycle: "oneTime",
      id: "one-time-entitlement",
      payments: [],
    };
    const summary = summarizeMemberships([oneTime], data.now);

    expect(summary).toMatchObject({
      activeCount: 1,
      confirmedPayments: [],
      estimatedMonthly: [],
      overdue: [],
      upcoming: [],
    });
    expect(oneTime.amount).toStrictEqual({ currency: "USD", minor: 1999 });
  });
});

describe("会员只读搜索与排序", () => {
  it("组合双语名称、方案和分类搜索，并忽略首尾空格及大小写", () => {
    const { memberships } = makeDemoData();
    const before = JSON.stringify(memberships);

    expect(
      filterMemberships(memberships, " CLOUD ", "cloud", "name", "en").map(
        ({ id }) => id
      )
    ).toStrictEqual(["demo-cloud"]);
    expect(
      filterMemberships(memberships, "年度存储", "", "name", "zh").map(
        ({ id }) => id
      )
    ).toStrictEqual(["demo-cloud"]);
    expect(
      filterMemberships(memberships, "community", "tools", "name", "en").map(
        ({ id }) => id
      )
    ).toStrictEqual(["demo-notes"]);
    expect(
      filterMemberships(memberships, "CLOUD", "media", "date", "en")
    ).toStrictEqual([]);
    expect(JSON.stringify(memberships)).toBe(before);
  });

  it("价格先按币种分组，再比较同币种小单位，未知金额置后", () => {
    const { memberships } = makeDemoData();
    const before = JSON.stringify(memberships);
    const sorted = filterMemberships(memberships, "", "", "price", "zh");

    expect(sorted.map(({ id }) => id)).toStrictEqual([
      "demo-design",
      "demo-study",
      "demo-cinema",
      "demo-notes",
      "demo-cloud",
      "demo-archive",
    ]);
    expect(sorted[0].amount).toStrictEqual({ currency: "CNY", minor: 6800 });
    expect(sorted[sorted.length - 1].amount).toBeNull();
    expect(JSON.stringify(memberships)).toBe(before);
  });

  it("日期使用处理截止日或权益结束日，未知日期置后，姓名排序也不修改源数据", () => {
    const { memberships } = makeDemoData();
    const before = JSON.stringify(memberships);

    expect(
      filterMemberships(memberships, "", "", "date", "en").map(({ id }) => id)
    ).toStrictEqual([
      "demo-study",
      "demo-cinema",
      "demo-design",
      "demo-cloud",
      "demo-archive",
      "demo-notes",
    ]);
    expect(
      filterMemberships(memberships, "", "", "name", "en").map(
        ({ name }) => name.en
      )
    ).toStrictEqual([
      "Demo Archive",
      "Demo Cinema",
      "Demo Cloud",
      "Demo Design",
      "Demo Learning",
      "Demo Notes",
    ]);
    expect(JSON.stringify(memberships)).toBe(before);
  });
});
