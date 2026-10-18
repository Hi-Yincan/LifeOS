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
  kind: "memberships" | "personal" | "servers";
  module: DashboardModule;
  title: LocalizedText;
};

export const getOverviewQueue = (
  data: DashboardDemoData,
  locale: DashboardLocale
): QueueItem[] => {
  const now = Date.parse(data.now);
  const day = 86_400_000;
  const queue: QueueItem[] = [];
  const text = (zh: string, en: string): string => (locale === "zh" ? zh : en);

  data.personal.schedule.forEach((event) => {
    const start = Date.parse(event.startsAt);

    if (event.status === "planned" && start >= now && start <= now + 7 * day) {
      queue.push({
        at: event.startsAt,
        detail: text("计划日程", "Scheduled event"),
        id: event.id,
        kind: "personal",
        module: "personal",
        title: event.title,
      });
    }
  });
  data.memberships.forEach((membership) => {
    const { renewal } = membership;
    const at = renewal.cancelBy || renewal.nextAt;

    if (renewal.status === "active" && at && Date.parse(at) <= now + 30 * day) {
      queue.push({
        at,
        detail: `${renewal.cancelBy ? text("取消截止", "Cancellation deadline") : text("续费计划日期", "Planned renewal date")} · ${membership.amount ? formatMoney(membership.amount, locale) : text("金额未知", "Amount unknown")}`,
        id: membership.id,
        kind: "memberships",
        module: "memberships",
        title: membership.name,
      });
    } else if (
      renewal.status === "unknown" ||
      membership.entitlement.status === "unknown"
    ) {
      queue.push({
        detail: text("核对权益与续费计划", "Review access and renewal details"),
        id: membership.id,
        kind: "memberships",
        module: "memberships",
        title: membership.name,
      });
    }
  });
  data.servers.forEach((server) => {
    if (server.expiresAt && Date.parse(server.expiresAt) <= now + 30 * day) {
      queue.push({
        at: server.expiresAt,
        detail: `${text("主机到期", "Host expiration")} · ${server.renewalCost ? formatMoney(server.renewalCost, locale) : text("续费金额未知", "Renewal amount unknown")}`,
        id: server.id,
        kind: "servers",
        module: "servers",
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
