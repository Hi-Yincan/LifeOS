/* eslint-disable unicorn/no-null -- 被隐藏的值使用契约约定的 null。 */
import {
  type DemoPrivacyPolicy,
  type PersonalData,
} from "components/apps/Dashboard/model";

export type DemoCalendarWindow = { from: null | string; toExclusive: string };
const DAY = 86_400_000;
// 只演示 UTC 日历规则：1 天延迟不含今日，7 天延迟再排除前六天。
export const getDemoCalendarWindow = (
  policy: DemoPrivacyPolicy,
  now: string
): DemoCalendarWindow => {
  const current = new Date(now);
  const today = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate()
  );
  const cutoff =
    policy.delayDays === 0
      ? current.getTime()
      : today - (policy.delayDays - 1) * DAY;
  let from: null | number = null;

  if (policy.history === "day" || policy.history === "threeDays") {
    const count = policy.history === "day" ? 1 : 3;

    from =
      policy.delayDays === 0 ? today - (count - 1) * DAY : cutoff - count * DAY;
  } else if (policy.history === "month") {
    const end = new Date(cutoff);
    const previousMonthLastDay = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)
    ).getUTCDate();

    from = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth() - 1,
      Math.min(end.getUTCDate(), previousMonthLastDay),
      end.getUTCHours(),
      end.getUTCMinutes(),
      end.getUTCSeconds(),
      end.getUTCMilliseconds()
    );
  }
  return {
    from: from === null ? null : new Date(from).toISOString(),
    toExclusive: new Date(cutoff).toISOString(),
  };
};
export const isInDemoWindow = (
  value: null | string,
  window: DemoCalendarWindow
): boolean => {
  if (!value) return false;

  const time = Date.parse(value);

  return (
    Number.isFinite(time) &&
    (window.from === null || time >= Date.parse(window.from)) &&
    time < Date.parse(window.toExclusive)
  );
};
// 这是合成资料的交互预览，真实授权、服务端裁剪与生产时区处理尚未实现。
export const selectPersonalDemoPreview = (
  personal: PersonalData,
  now: string
): PersonalData => {
  const allowed = (
    id: keyof PersonalData["policies"],
    time: null | string
  ): boolean =>
    personal.policies[id].visibility === "public" &&
    isInDemoWindow(time, getDemoCalendarWindow(personal.policies[id], now));

  return {
    ...personal,
    activities: personal.activities.filter(
      (item) =>
        allowed("activity", item.startedAt) &&
        (item.endedAt === null
          ? personal.policies.activity.delayDays === 0
          : Date.parse(item.endedAt) <=
            Date.parse(
              getDemoCalendarWindow(personal.policies.activity, now).toExclusive
            ))
    ),
    checkups: personal.checkups.filter((item) =>
      allowed("checkups", item.date)
    ),
    health: personal.health
      .filter(({ id }) => personal.policies[id].visibility === "public")
      .map((item) => {
        const selected = item.points.filter(({ at }) => allowed(item.id, at));
        const latest = selected[selected.length - 1];
        const currentAllowed = allowed(item.id, item.observedAt);

        return {
          ...item,
          freshness: currentAllowed
            ? item.freshness
            : latest?.value !== null && latest?.value !== undefined
              ? "stale"
              : "unknown",
          note: currentAllowed
            ? item.note
            : {
                en: "Sample selected within the demonstration window.",
                zh: "仅显示演示时间范围内的样本。",
              },
          observedAt: currentAllowed ? item.observedAt : (latest?.at ?? null),
          points: selected,
          value: currentAllowed ? item.value : (latest?.value ?? null),
        };
      }),
    location:
      personal.location && allowed("location", personal.location.observedAt)
        ? personal.location
        : null,
    route: personal.route.filter(({ at }) => allowed("location", at)),
    // 未来安排是计划字段；无延迟时保留，不能当成未来测量样本删除。
    schedule: personal.schedule.filter(
      ({ startsAt }) =>
        allowed("schedule", startsAt) ||
        (personal.policies.schedule.visibility === "public" &&
          personal.policies.schedule.delayDays === 0 &&
          Date.parse(startsAt) >= Date.parse(now))
    ),
  };
};
