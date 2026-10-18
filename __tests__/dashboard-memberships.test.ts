/* eslint-disable unicorn/no-null -- 测试未知值与确定为零的不同语义。 */
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import {
  type Money,
  type PaymentRecord,
} from "components/apps/Dashboard/model";
import { summarizeMemberships } from "components/apps/Dashboard/shared";
import {
  confirmPayment,
  decideRenewal,
  draftMembership,
  filterMemberships,
  moneyInput,
  parseAmount,
  parseDateInput,
  saveMembershipDraft,
} from "components/apps/Dashboard/views/Memberships/functions";

describe("会员示例金额输入", () => {
  it("区分未知与确定免费，使用整数小单位精确解析", () => {
    expect(parseAmount(" ", "CNY")).toBeNull();
    expect(parseAmount("0", "CNY")).toStrictEqual({
      currency: "CNY",
      minor: 0,
    });
    expect(parseAmount("0.29", "CNY")).toStrictEqual({
      currency: "CNY",
      minor: 29,
    });
    expect(parseAmount("12.3", "USD")).toStrictEqual({
      currency: "USD",
      minor: 1230,
    });
    expect(parseAmount("250", "JPY")).toStrictEqual({
      currency: "JPY",
      minor: 250,
    });
  });

  it.each(["-1", "NaN", "1e3", "1,000", "1.001", "90071992547409.92"])(
    "拒绝非法或不安全金额 %s",
    (value) => {
      expect(() => parseAmount(value, "CNY")).toThrow(
        "INVALID_MEMBERSHIP_AMOUNT"
      );
    }
  );

  it("拒绝日元小数且保留币种", () => {
    expect(() => parseAmount("1.01", "JPY")).toThrow(
      "INVALID_MEMBERSHIP_AMOUNT"
    );
    expect(parseAmount("10.00", "USD")).toStrictEqual({
      currency: "USD",
      minor: 1000,
    });
  });

  it.each<Money>([
    { currency: "CNY", minor: 9007199254740990 },
    { currency: "USD", minor: Number.MAX_SAFE_INTEGER },
    { currency: "JPY", minor: Number.MAX_SAFE_INTEGER },
    { currency: "EUR", minor: 1 },
    { currency: "CNY", minor: 0 },
  ])("安全整数金额从编辑框往返不丢精度：$currency/$minor", (amount) => {
    expect(parseAmount(moneyInput(amount), amount.currency)).toStrictEqual(
      amount
    );
  });
});

describe("会员日期与表单", () => {
  it("按 UTC 校验真实日期并保留未知日期", () => {
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("2024-02-29")).toBe("2024-02-29T00:00:00.000Z");
    expect(() => parseDateInput("2025-02-29")).toThrow(
      "INVALID_MEMBERSHIP_DATE"
    );
    expect(() => parseDateInput("2026-04-31")).toThrow(
      "INVALID_MEMBERSHIP_DATE"
    );
    expect(() => parseDateInput("10/18/2026")).toThrow(
      "INVALID_MEMBERSHIP_DATE"
    );
  });

  it("要求双语名称并拒绝颠倒的权益与处理日期", () => {
    const draft = draftMembership(makeDemoData().memberships[0]);
    expect(saveMembershipDraft({ ...draft, nameEn: " " }, "new")).toStrictEqual(
      {
        error: "name",
      }
    );
    expect(
      saveMembershipDraft({ ...draft, endsOn: "2026-01-01" }, "new")
    ).toStrictEqual({ error: "dates" });
    expect(
      saveMembershipDraft({ ...draft, cancelOn: "2026-12-01" }, "new")
    ).toStrictEqual({ error: "dates" });
  });

  it("取消续费与一次性方案清除计划日期但不修改权益和已确认付款", () => {
    const original = makeDemoData().memberships[0];
    const result = saveMembershipDraft(
      { ...draftMembership(original), renewalStatus: "cancelled" },
      original.id,
      original
    );
    if (!("item" in result)) throw new Error("Expected valid membership");
    expect(result.item.payments).toStrictEqual(original.payments);
    expect(Date.parse(result.item.entitlement.endsAt || "")).toBe(
      Date.parse(original.entitlement.endsAt || "")
    );
    expect(result.item.renewal).toStrictEqual({
      autoRenew: "off",
      cancelBy: null,
      nextAt: null,
      status: "cancelled",
    });
    const oneTime = saveMembershipDraft(
      { ...draftMembership(original), cycle: "oneTime" },
      original.id,
      original
    );
    expect("item" in oneTime && oneTime.item.renewal.nextAt).toBeNull();
  });
});

describe("会员续费决定与付款确认", () => {
  it("暂停或取消续费不会结束权益或增加付款", () => {
    const original = makeDemoData().memberships[0];
    const paused = decideRenewal(original, "paused");
    const cancelled = decideRenewal(original, "cancelled");
    expect([paused.entitlement, cancelled.entitlement]).toStrictEqual([
      original.entitlement,
      original.entitlement,
    ]);
    expect(cancelled.payments).toStrictEqual(original.payments);
    expect(cancelled.renewal.nextAt).toBeNull();
    expect(original.renewal.status).toBe("active");
    expect(
      summarizeMemberships([cancelled], makeDemoData().now).estimatedMonthly
    ).toStrictEqual([]);
  });

  it("付款确认只追加付款，重复确认相同事件幂等且不推进账期", () => {
    const data = makeDemoData();
    const original = data.memberships[0];
    const payment: PaymentRecord = {
      amount: { currency: "CNY", minor: 2500 },
      id: "test-payment",
      note: { en: "Synthetic", zh: "合成记录" },
      paidAt: "2026-10-18T00:00:00.000Z",
    };
    const confirmed = confirmPayment(original, payment, data.now);
    expect(confirmed.payments).toHaveLength(original.payments.length + 1);
    expect(confirmed.renewal).toStrictEqual(original.renewal);
    expect(confirmed.entitlement).toStrictEqual(original.entitlement);
    expect(confirmPayment(confirmed, payment, data.now)).toBe(confirmed);
    expect(original.payments).toHaveLength(1);
  });

  it("未来日期与非法金额不能记为已经付款", () => {
    const data = makeDemoData();
    const payment: PaymentRecord = {
      amount: { currency: "USD", minor: 100 },
      id: "future",
      note: { en: "Synthetic", zh: "合成记录" },
      paidAt: "2026-11-01T00:00:00Z",
    };
    expect(() =>
      confirmPayment(data.memberships[0], payment, data.now)
    ).toThrow("INVALID_MEMBERSHIP_PAYMENT");
    expect(() =>
      confirmPayment(
        data.memberships[0],
        {
          ...payment,
          amount: { currency: "USD", minor: -1 },
          paidAt: data.now,
        },
        data.now
      )
    ).toThrow("INVALID_MEMBERSHIP_PAYMENT");
  });

  it("组合搜索和分类，排序不跨币种比较大小，也不修改原数据", () => {
    const { memberships } = makeDemoData();
    const before = memberships.map(({ id }) => id);
    expect(
      filterMemberships(memberships, "CLOUD", "cloud", "name", "en").map(
        ({ id }) => id
      )
    ).toStrictEqual(["demo-cloud"]);
    expect(
      filterMemberships(memberships, "CLOUD", "media", "date", "en")
    ).toStrictEqual([]);
    const sorted = filterMemberships(memberships, "", "", "price", "zh");
    expect(sorted[0].amount).toStrictEqual({ currency: "CNY", minor: 6800 });
    expect(sorted[sorted.length - 1].amount).toBeNull();
    expect(memberships.map(({ id }) => id)).toStrictEqual(before);
  });
});
