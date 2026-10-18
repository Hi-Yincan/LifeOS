import {
  type DashboardDemoData,
  type DashboardLocale,
  type DashboardModule,
  type LocalizedText,
} from "components/apps/Dashboard/model";
import { formatMoney, localize } from "components/apps/Dashboard/shared";

export type QueueItem = {
  at?: string;
  detail: string;
  id: string;
  isOverdue: boolean;
  kind: "memberships" | "personal" | "servers";
  module: DashboardModule;
  timePrecision: "date" | "instant" | "unknown";
  title: LocalizedText;
};

const utcDateStart = (value: string): number => {
  const date = new Date(value);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export const getOverviewQueue = (
  data: DashboardDemoData,
  locale: DashboardLocale
): QueueItem[] => {
  const now = Date.parse(data.now);
  const day = 86_400_000;
  const today = utcDateStart(data.now);
  const dateWindowEnd = today + 30 * day;
  const queue: QueueItem[] = [];
  const text = (zh: string, en: string): string => (locale === "zh" ? zh : en);

  data.personal.schedule.forEach((event) => {
    const start = Date.parse(event.startsAt);

    if (event.status === "planned" && start >= now && start <= now + 7 * day) {
      queue.push({
        at: event.startsAt,
        detail: text("计划日程", "Scheduled event"),
        id: event.id,
        isOverdue: false,
        kind: "personal",
        module: "personal",
        timePrecision: "instant",
        title: event.title,
      });
    }
  });
  data.memberships.forEach((membership) => {
    const { renewal } = membership;
    const at = renewal.cancelBy || renewal.nextAt;

    if (renewal.status === "active" && at && utcDateStart(at) < dateWindowEnd) {
      queue.push({
        at,
        detail: `${renewal.cancelBy ? text("取消截止", "Cancellation deadline") : text("续费计划日期", "Planned renewal date")} · ${membership.amount ? formatMoney(membership.amount, locale) : text("金额未知", "Amount unknown")}`,
        id: membership.id,
        isOverdue: utcDateStart(at) < today,
        kind: "memberships",
        module: "memberships",
        timePrecision: "date",
        title: membership.name,
      });
    } else if (
      renewal.status === "unknown" ||
      membership.entitlement.status === "unknown"
    ) {
      queue.push({
        detail: text("核对权益与续费计划", "Review access and renewal details"),
        id: membership.id,
        isOverdue: false,
        kind: "memberships",
        module: "memberships",
        timePrecision: "unknown",
        title: membership.name,
      });
    }
  });
  data.servers.forEach((server) => {
    if (server.expiresAt && utcDateStart(server.expiresAt) < dateWindowEnd) {
      queue.push({
        at: server.expiresAt,
        detail: `${text("主机到期", "Host expiration")} · ${server.renewalCost ? formatMoney(server.renewalCost, locale) : text("续费金额未知", "Renewal amount unknown")}`,
        id: server.id,
        isOverdue: utcDateStart(server.expiresAt) < today,
        kind: "servers",
        module: "servers",
        timePrecision: "date",
        title: server.name,
      });
    }
  });

  return queue.sort((first, second) => {
    const firstTime = first.at
      ? Date.parse(first.at)
      : Number.POSITIVE_INFINITY;
    const secondTime = second.at
      ? Date.parse(second.at)
      : Number.POSITIVE_INFINITY;

    return (
      firstTime - secondTime ||
      localize(first.title, locale).localeCompare(
        localize(second.title, locale)
      )
    );
  });
};
