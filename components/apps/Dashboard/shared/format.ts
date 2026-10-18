/* eslint-disable unicorn/no-null -- 展示契约用 null 区分未知值与确定为零。 */
import {
  type Currency,
  type DashboardLocale,
  type Freshness,
  type HealthStatus,
  type LocalizedText,
  type Money,
} from "components/apps/Dashboard/model";

const localeTag = (locale: DashboardLocale): string =>
  locale === "zh" ? "zh-CN" : "en-US";
export const localize = (
  value: LocalizedText,
  locale: DashboardLocale
): string => value[locale];
export const formatNumber = (
  value: null | number,
  locale: DashboardLocale,
  options: Intl.NumberFormatOptions = {}
): string =>
  value === null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat(localeTag(locale), {
        maximumFractionDigits: 1,
        ...options,
      }).format(value);

export const currencyScale = (currency: Currency): number =>
  currency === "JPY" ? 1 : 100;
export const isValidMoney = (money: Money): boolean =>
  ["CNY", "EUR", "JPY", "USD"].includes(money.currency) &&
  Number.isSafeInteger(money.minor) &&
  money.minor >= 0;
export const formatMoney = (
  value: Money | null,
  locale: DashboardLocale
): string => {
  if (!value || !isValidMoney(value)) return "—";

  const scale = currencyScale(value.currency);
  const fraction = String(value.minor % scale).padStart(2, "0");

  // 分别格式化整数与最小货币单位，避免大额小数丢失末位。
  return new Intl.NumberFormat(localeTag(locale), {
    currency: value.currency,
    currencyDisplay: "code",
    style: "currency",
  })
    .formatToParts(Math.floor(value.minor / scale))
    .map(({ type, value: part }) => (type === "fraction" ? fraction : part))
    .join("");
};
const dateFormat = (
  value: null | string,
  locale: DashboardLocale,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string => {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";

  return new Intl.DateTimeFormat(localeTag(locale), {
    ...options,
    timeZone,
  }).format(new Date(value));
};
export const formatDate = (
  value: null | string,
  locale: DashboardLocale,
  timeZone = "UTC"
): string =>
  dateFormat(value, locale, timeZone, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export const formatTime = (
  value: null | string,
  locale: DashboardLocale,
  timeZone = "UTC"
): string =>
  dateFormat(value, locale, timeZone, {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
export const formatDateTime = (
  value: null | string,
  locale: DashboardLocale,
  timeZone = "UTC"
): string =>
  dateFormat(value, locale, timeZone, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
  });
export const formatBytes = (
  value: null | number,
  locale: DashboardLocale
): string => {
  if (value === null || !Number.isFinite(value) || value < 0) return "—";

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const exponent =
    value === 0
      ? 0
      : Math.min(
          Math.floor(Math.log(value) / Math.log(1024)),
          units.length - 1
        );
  const index = Math.max(0, exponent);

  return `${formatNumber(value / 1024 ** index, locale)} ${units[index]}`;
};
export const formatDuration = (
  seconds: null | number,
  locale: DashboardLocale
): string => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return locale === "zh" ? `${days} 天 ${hours} 小时` : `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return locale === "zh"
      ? `${hours} 小时 ${minutes} 分钟`
      : `${hours}h ${minutes}m`;
  }
  return locale === "zh" ? `${minutes} 分钟` : `${minutes}m`;
};
export const percentage = (
  used: null | number,
  total: null | number
): null | number =>
  used === null ||
  total === null ||
  !Number.isFinite(used) ||
  !Number.isFinite(total) ||
  used < 0 ||
  total <= 0
    ? null
    : (used / total) * 100;
export const daysUntil = (date: null | string, now: string): null | number => {
  if (!date) return null;

  const difference = Date.parse(date) - Date.parse(now);

  return Number.isFinite(difference)
    ? Math.ceil(difference / 86_400_000)
    : null;
};
export const safeExternalUrl = (input: null | string): null | string => {
  if (!input) return null;

  try {
    const url = new URL(input);

    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};
const healthLabels: Record<HealthStatus, LocalizedText> = {
  degraded: { en: "Degraded", zh: "性能下降" },
  down: { en: "Down", zh: "不可用" },
  maintenance: { en: "Maintenance", zh: "维护中" },
  pending: { en: "Pending confirmation", zh: "检测待确认" },
  unknown: { en: "Unknown", zh: "未知" },
  up: { en: "Operational", zh: "正常" },
};
const freshnessLabels: Record<Freshness, LocalizedText> = {
  fresh: { en: "Current sample", zh: "样本有效" },
  stale: { en: "Stale sample", zh: "样本已过期" },
  unavailable: { en: "Source unavailable", zh: "来源不可用" },
  unknown: { en: "Time unknown", zh: "时间未知" },
};
export const healthLabel = (
  status: HealthStatus,
  locale: DashboardLocale
): string => localize(healthLabels[status], locale);
export const freshnessLabel = (
  freshness: Freshness,
  locale: DashboardLocale
): string => localize(freshnessLabels[freshness], locale);
