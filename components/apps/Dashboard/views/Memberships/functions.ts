/* eslint-disable unicorn/no-null -- 示例契约以 null 区分未知金额与日期。 */
import {
  type Currency,
  type DashboardLocale,
  type Membership,
  type Money,
  type PaymentRecord,
} from "components/apps/Dashboard/model";
import { currencyScale, isValidMoney } from "components/apps/Dashboard/shared";

export type MembershipDraft = {
  amount: string;
  autoRenew: Membership["renewal"]["autoRenew"];
  cancelOn: string;
  category: Membership["category"];
  currency: Currency;
  cycle: Membership["cycle"];
  endsOn: string;
  entitlementStatus: Membership["entitlement"]["status"];
  nameEn: string;
  nameZh: string;
  nextOn: string;
  noteEn: string;
  noteZh: string;
  planEn: string;
  planZh: string;
  renewalStatus: Membership["renewal"]["status"];
  startsOn: string;
  visibility: Membership["visibility"];
};
export type ValidationKey = "amount" | "dates" | "name";
export const dateInput = (value: null | string): string =>
  value?.slice(0, 10) || "";
export const moneyInput = (amount: Money | null): string => {
  if (!amount) return "";
  if (!isValidMoney(amount)) throw new Error("INVALID_MEMBERSHIP_AMOUNT");
  const scale = currencyScale(amount.currency);
  if (scale === 1) return String(amount.minor);
  return `${Math.floor(amount.minor / scale)}.${String(amount.minor % scale).padStart(2, "0")}`;
};

export const parseAmount = (
  input: string,
  currency: Currency
): Money | null => {
  const value = input.trim();
  if (!value) return null;
  const scale = currencyScale(currency);
  if (!(scale === 1 ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(value)) {
    throw new Error("INVALID_MEMBERSHIP_AMOUNT");
  }
  const [whole, fraction = ""] = value.split(".");
  const minor =
    Number(whole) * scale + (scale === 1 ? 0 : Number(fraction.padEnd(2, "0")));
  const amount = { currency, minor };
  if (!isValidMoney(amount)) throw new Error("INVALID_MEMBERSHIP_AMOUNT");
  return amount;
};

// 演示契约固定使用 UTC；日期输入不依赖浏览器所在时区。
export const parseDateInput = (value: string): null | string => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("INVALID_MEMBERSHIP_DATE");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("INVALID_MEMBERSHIP_DATE");
  }
  return parsed.toISOString();
};

export const draftMembership = (item?: Membership): MembershipDraft => ({
  amount: moneyInput(item?.amount || null),
  autoRenew: item?.renewal.autoRenew || "unknown",
  cancelOn: dateInput(item?.renewal.cancelBy || null),
  category: item?.category || "tools",
  currency: item?.amount?.currency || "CNY",
  cycle: item?.cycle || "monthly",
  endsOn: dateInput(item?.entitlement.endsAt || null),
  entitlementStatus: item?.entitlement.status || "unknown",
  nameEn: item?.name.en || "",
  nameZh: item?.name.zh || "",
  nextOn: dateInput(item?.renewal.nextAt || null),
  noteEn: item?.note.en || "",
  noteZh: item?.note.zh || "",
  planEn: item?.planName.en || "",
  planZh: item?.planName.zh || "",
  renewalStatus: item?.renewal.status || "unknown",
  startsOn: dateInput(item?.entitlement.startsAt || null),
  visibility: item?.visibility || "private",
});

export const saveMembershipDraft = (
  draft: MembershipDraft,
  id: string,
  original?: Membership
): { error: ValidationKey } | { item: Membership } => {
  if (!draft.nameEn.trim() || !draft.nameZh.trim()) return { error: "name" };
  let amount: Money | null;
  try {
    amount = parseAmount(draft.amount, draft.currency);
  } catch {
    return { error: "amount" };
  }
  let startsAt: null | string;
  let endsAt: null | string;
  let nextAt: null | string;
  let cancelBy: null | string;
  const noRenewal =
    draft.cycle === "oneTime" || draft.renewalStatus === "cancelled";
  try {
    startsAt = parseDateInput(draft.startsOn);
    endsAt = parseDateInput(draft.endsOn);
    nextAt = noRenewal ? null : parseDateInput(draft.nextOn);
    cancelBy = noRenewal ? null : parseDateInput(draft.cancelOn);
  } catch {
    return { error: "dates" };
  }
  if (
    (startsAt && endsAt && startsAt > endsAt) ||
    (cancelBy && nextAt && cancelBy > nextAt)
  ) {
    return { error: "dates" };
  }
  return {
    item: {
      amount,
      category: draft.category,
      cycle: draft.cycle,
      entitlement: { endsAt, startsAt, status: draft.entitlementStatus },
      id,
      managementUrl: original?.managementUrl || null,
      name: { en: draft.nameEn.trim(), zh: draft.nameZh.trim() },
      note: { en: draft.noteEn.trim(), zh: draft.noteZh.trim() },
      payments: original?.payments || [],
      planName: { en: draft.planEn.trim(), zh: draft.planZh.trim() },
      renewal: {
        autoRenew: noRenewal ? "off" : draft.autoRenew,
        cancelBy: noRenewal ? null : cancelBy,
        nextAt: noRenewal ? null : nextAt,
        status: draft.cycle === "oneTime" ? "cancelled" : draft.renewalStatus,
      },
      serviceId: original?.serviceId || null,
      visibility: draft.visibility,
    },
  };
};

export const decideRenewal = (
  item: Membership,
  status: "active" | "cancelled" | "paused"
): Membership => ({
  ...item,
  renewal: {
    ...item.renewal,
    ...(status === "cancelled"
      ? ({ autoRenew: "off", cancelBy: null, nextAt: null } as const)
      : {}),
    status,
  },
});

export const confirmPayment = (
  item: Membership,
  payment: PaymentRecord,
  now: string
): Membership => {
  const paidAt = Date.parse(payment.paidAt);
  if (
    !isValidMoney(payment.amount) ||
    !Number.isFinite(paidAt) ||
    paidAt > Date.parse(now)
  ) {
    throw new Error("INVALID_MEMBERSHIP_PAYMENT");
  }
  if (item.payments.some(({ id }) => id === payment.id)) return item;
  return { ...item, payments: [...item.payments, payment] };
};

export type MembershipSort = "date" | "name" | "price";
export const filterMemberships = (
  memberships: Membership[],
  search: string,
  category: "" | Membership["category"],
  sort: MembershipSort,
  locale: DashboardLocale
): Membership[] =>
  memberships
    .filter(
      (item) =>
        (!category || item.category === category) &&
        `${item.name.zh} ${item.name.en} ${item.planName.zh} ${item.planName.en}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
    )
    .sort((first, second) => {
      if (sort === "date") {
        const firstAt =
          first.renewal.status === "active"
            ? first.renewal.cancelBy || first.renewal.nextAt
            : first.entitlement.endsAt;
        const secondAt =
          second.renewal.status === "active"
            ? second.renewal.cancelBy || second.renewal.nextAt
            : second.entitlement.endsAt;
        return (firstAt || "9999").localeCompare(secondAt || "9999");
      }
      if (sort === "price") {
        if (!first.amount) return second.amount ? 1 : 0;
        if (!second.amount) return -1;
        const currency = first.amount.currency.localeCompare(
          second.amount.currency
        );
        if (currency) return currency;
        return second.amount.minor - first.amount.minor;
      }
      return first.name[locale].localeCompare(second.name[locale], locale);
    });
