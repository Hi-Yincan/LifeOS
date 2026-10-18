/* eslint-disable unicorn/no-null -- 未知金额保留 null，不显示为免费。 */
import { type Membership, type Money } from "components/apps/Dashboard/model";
import {
  currencyScale,
  isValidMoney,
} from "components/apps/Dashboard/shared/format";

export type DisplayCurrency = "CNY" | "USD";

// 固定的合成汇率：每一主货币单位对应的人民币分，不代表实时汇率。
const demoRates = { CNY: 100n, EUR: 780n, JPY: 5n, USD: 720n };
const commonUnits = (amount: Money): bigint => {
  if (!isValidMoney(amount)) throw new Error("INVALID_DEMO_MONEY");

  return (
    BigInt(amount.minor) *
    demoRates[amount.currency] *
    (100n / BigInt(currencyScale(amount.currency)))
  );
};
const displayAmount = (
  total: bigint,
  currency: DisplayCurrency,
  periods = 1n
): Money => {
  const divisor = demoRates[currency] * periods;
  // 先累加与折算，最后一次舍入；避免大额金额和多笔小额的浮点误差。
  const minor = (total + divisor / 2n) / divisor;
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("DEMO_MONEY_OVERFLOW");
  }

  return { currency, minor: Number(minor) };
};
export const sumDisplayMoney = (
  amounts: Money[],
  currency: DisplayCurrency
): Money =>
  displayAmount(
    amounts.reduce((total, amount) => total + commonUnits(amount), 0n),
    currency
  );
export const convertDisplayMoney = (
  amount: Money | null,
  currency: DisplayCurrency
): Money | null =>
  amount === null ? null : displayAmount(commonUnits(amount), currency);

export const estimateMonthlyCost = (
  memberships: Membership[],
  currency: DisplayCurrency
): Money | null => {
  const planned = memberships.filter(
    (item) =>
      item.renewal.status === "active" &&
      item.cycle !== "oneTime" &&
      item.amount !== null
  );
  if (planned.length === 0) return null;

  const annual = planned.reduce(
    (total, item) =>
      total +
      commonUnits(item.amount as Money) * (item.cycle === "yearly" ? 1n : 12n),
    0n
  );
  return displayAmount(annual, currency, 12n);
};
