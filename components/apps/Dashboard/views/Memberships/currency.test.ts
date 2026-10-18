/* eslint-disable unicorn/no-null -- 验证未知金额与零金额的区别。 */
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import {
  convertDisplayMoney,
  estimateMonthlyCost,
  sumDisplayMoney,
} from "components/apps/Dashboard/views/Memberships/currency";
import { filterMemberships } from "components/apps/Dashboard/views/Memberships/functions";

describe("membership display currency", () => {
  it("converts both ways without changing unknown, free or source values", () => {
    const amount = { currency: "USD" as const, minor: 12000 };
    expect(convertDisplayMoney(amount, "CNY")).toStrictEqual({
      currency: "CNY",
      minor: 86400,
    });
    expect(
      convertDisplayMoney({ currency: "CNY", minor: 86400 }, "USD")
    ).toStrictEqual(amount);
    expect(convertDisplayMoney(null, "USD")).toBeNull();
    expect(
      convertDisplayMoney({ currency: "CNY", minor: 0 }, "USD")
    ).toStrictEqual({ currency: "USD", minor: 0 });
    expect(amount).toStrictEqual({ currency: "USD", minor: 12000 });
  });

  it("sums before rounding and preserves safe integer precision", () => {
    expect(
      sumDisplayMoney(
        [
          { currency: "CNY", minor: 4 },
          { currency: "CNY", minor: 4 },
        ],
        "USD"
      )
    ).toStrictEqual({ currency: "USD", minor: 1 });
    expect(
      convertDisplayMoney(
        { currency: "CNY", minor: Number.MAX_SAFE_INTEGER },
        "CNY"
      )?.minor
    ).toBe(Number.MAX_SAFE_INTEGER);
    expect(
      convertDisplayMoney({ currency: "JPY", minor: 100 }, "CNY")
    ).toStrictEqual({ currency: "CNY", minor: 500 });
    expect(() =>
      convertDisplayMoney(
        { currency: "USD", minor: Number.MAX_SAFE_INTEGER },
        "CNY"
      )
    ).toThrow("DEMO_MONEY_OVERFLOW");
    expect(() =>
      convertDisplayMoney({ currency: "USD", minor: 1.5 }, "CNY")
    ).toThrow("INVALID_DEMO_MONEY");
  });

  it("converts recurring estimates while excluding cancelled and one-time plans", () => {
    const data = makeDemoData();
    const snapshot = JSON.stringify(data);
    expect(estimateMonthlyCost(data.memberships, "CNY")).toStrictEqual({
      currency: "CNY",
      minor: 13600,
    });
    expect(estimateMonthlyCost(data.memberships, "USD")).toStrictEqual({
      currency: "USD",
      minor: 1889,
    });
    expect(
      sumDisplayMoney(
        data.memberships.flatMap((item) =>
          item.payments.map((payment) => payment.amount)
        ),
        "CNY"
      )
    ).toStrictEqual({ currency: "CNY", minor: 95700 });
    expect(
      estimateMonthlyCost(
        data.memberships.filter((item) => item.id === "demo-design"),
        "USD"
      )
    ).toBeNull();
    expect(estimateMonthlyCost([], "CNY")).toBeNull();
    expect(JSON.stringify(data)).toBe(snapshot);
  });

  it("sorts prices by their displayed value while retaining unknown records last", () => {
    const data = makeDemoData();
    const before = JSON.stringify(data.memberships);
    const sorted = filterMemberships(
      data.memberships,
      "",
      "",
      "price",
      "en",
      "CNY"
    );
    expect(sorted.map(({ id }) => id)).toStrictEqual([
      "demo-cloud",
      "demo-design",
      "demo-study",
      "demo-cinema",
      "demo-notes",
      "demo-archive",
    ]);
    expect(JSON.stringify(data.memberships)).toBe(before);
  });
});
