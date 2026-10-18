/* eslint-disable unicorn/no-null -- 关联与时间字段缺失时使用显式 null。 */
import {
  type DashboardDemoData,
  type Membership,
  type Money,
  type Service,
} from "components/apps/Dashboard/model";
import { isValidMoney } from "components/apps/Dashboard/shared/format";
import { selectPersonalDemoPreview } from "components/apps/Dashboard/shared/preview";

export const sumMoneyByCurrency = (amounts: Money[]): Money[] => {
  const totals = new Map<Money["currency"], number>();

  amounts.forEach((amount) => {
    if (!isValidMoney(amount)) throw new Error("INVALID_DEMO_MONEY");

    const total = (totals.get(amount.currency) || 0) + amount.minor;

    if (!Number.isSafeInteger(total)) throw new Error("DEMO_MONEY_OVERFLOW");
    totals.set(amount.currency, total);
  });
  return [...totals]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([currency, minor]) => ({ currency, minor }));
};
export type MembershipSummary = {
  activeCount: number;
  confirmedPayments: Money[];
  estimatedMonthly: Money[];
  overdue: Membership[];
  unknownAmountCount: number;
  upcoming: Membership[];
};
export const summarizeMemberships = (
  memberships: Membership[],
  now: string
): MembershipSummary => {
  const nowTime = Date.parse(now);
  if (!Number.isFinite(nowTime)) throw new Error("INVALID_DEMO_DATE");
  const current = new Date(nowTime);
  const today = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate()
  );
  const planned = memberships.filter(
    (item) => item.renewal.status === "active" && item.cycle !== "oneTime"
  );
  const estimates = planned.flatMap((item): Money[] => {
    if (item.amount === null) return [];
    if (!isValidMoney(item.amount)) throw new Error("INVALID_DEMO_MONEY");

    return [
      {
        currency: item.amount.currency,
        minor:
          item.cycle === "yearly" ? item.amount.minor : item.amount.minor * 12,
      },
    ];
  });

  return {
    activeCount: memberships.filter((item) =>
      ["active", "trial"].includes(item.entitlement.status)
    ).length,
    confirmedPayments: sumMoneyByCurrency(
      memberships.flatMap((item) => item.payments.map(({ amount }) => amount))
    ),
    estimatedMonthly: sumMoneyByCurrency(estimates).map(
      ({ currency, minor }) => ({ currency, minor: Math.round(minor / 12) })
    ),
    overdue: planned.filter(
      (item) =>
        item.renewal.nextAt !== null && Date.parse(item.renewal.nextAt) < today
    ),
    unknownAmountCount: memberships.filter((item) => item.amount === null)
      .length,
    upcoming: planned
      .filter((item) => {
        const next = item.renewal.nextAt && Date.parse(item.renewal.nextAt);

        return (
          typeof next === "number" && Number.isFinite(next) && next >= today
        );
      })
      .sort((first, second) =>
        (first.renewal.nextAt || "").localeCompare(second.renewal.nextAt || "")
      ),
  };
};
export type ServiceSummary = {
  attention: number;
  healthy: number;
  pending: number;
  stale: number;
  total: number;
  unknown: number;
  unmonitored: number;
};
export const summarizeServices = (services: Service[]): ServiceSummary => ({
  attention: services.filter((item) =>
    ["degraded", "down"].includes(item.health)
  ).length,
  healthy: services.filter(
    (item) => item.health === "up" && item.freshness === "fresh"
  ).length,
  pending: services.filter(
    (item) => item.monitor !== null && item.health === "pending"
  ).length,
  stale: services.filter((item) => item.freshness === "stale").length,
  total: services.length,
  unknown: services.filter(
    (item) => item.monitor !== null && item.health === "unknown"
  ).length,
  unmonitored: services.filter((item) => item.monitor === null).length,
});

// 仅用于合成数据的访客视图演示，不能作为真实数据授权或公开导出规则。
export const selectVisibleDemoData = (
  data: DashboardDemoData,
  mode: "all" | "visitor" = "all"
): DashboardDemoData => {
  if (mode === "all") return data;

  const servers = data.servers.filter((item) => item.visibility === "public");
  const serverIds = new Set(servers.map(({ id }) => id));
  const services = data.services
    .filter((item) => item.visibility === "public")
    .map((item) => ({
      ...item,
      serverId:
        item.serverId && serverIds.has(item.serverId) ? item.serverId : null,
    }));
  const serviceIds = new Set(services.map(({ id }) => id));
  const memberships = data.memberships
    .filter((item) => item.visibility === "public")
    .map((item) => ({
      ...item,
      serviceId:
        item.serviceId && serviceIds.has(item.serviceId)
          ? item.serviceId
          : null,
    }));
  const selectedPersonal = selectPersonalDemoPreview(data.personal, data.now);
  const sourceIds = new Set([
    ...servers.map(({ sourceId }) => sourceId),
    ...services.map(({ sourceId }) => sourceId),
    ...selectedPersonal.activities.map(({ sourceId }) => sourceId),
    ...selectedPersonal.health.map(({ sourceId }) => sourceId),
    ...(selectedPersonal.location ? [selectedPersonal.location.sourceId] : []),
  ]);

  return {
    ...data,
    memberships,
    personal: selectedPersonal,
    servers,
    services,
    sources: data.sources
      .filter(({ id }) => sourceIds.has(id))
      .map((source) => ({
        ...source,
        fetchedAt: null,
        freshness: "unknown",
        note: {
          en: "Visitor preview hides source timing details.",
          zh: "访客预览隐藏来源时间细节。",
        },
        observedAt: null,
        sourceUpdatedAt: null,
      })),
  };
};
