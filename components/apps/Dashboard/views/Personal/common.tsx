import { type ReactNode } from "react";
import {
  type DashboardDemoData,
  type DashboardLocale,
  type DashboardViewProps,
  type LocalizedText,
  type PersonalData,
} from "components/apps/Dashboard/model";
import {
  formatDateTime,
  freshnessLabel,
  Muted,
} from "components/apps/Dashboard/shared";

export type PersonalTab = "activity" | "checkups" | "health" | "location";
export type EditTarget = {
  id: string;
  kind: "activity" | "checkup" | "health" | "location" | "schedule";
};
export type PanelProps = DashboardViewProps & {
  onEdit: (target: EditTarget) => void;
};
export const tabs: {
  id: PersonalTab;
  label: LocalizedText;
  shortLabel: LocalizedText;
}[] = [
  {
    id: "activity",
    label: { en: "Activity & schedule", zh: "活动与日程" },
    shortLabel: { en: "Activity", zh: "活动日程" },
  },
  {
    id: "location",
    label: { en: "Location & route", zh: "位置与轨迹" },
    shortLabel: { en: "Location", zh: "位置轨迹" },
  },
  {
    id: "health",
    label: { en: "Daily health", zh: "日常健康" },
    shortLabel: { en: "Health", zh: "健康" },
  },
  {
    id: "checkups",
    label: { en: "Checkup records", zh: "检查记录" },
    shortLabel: { en: "Checkups", zh: "检查" },
  },
];
export const getPersonalTab = (
  personal: PersonalData,
  selectedId?: string
): PersonalTab => {
  if (
    ["health", "heartRate", "sleep", "steps", "weight"].includes(
      selectedId || ""
    ) ||
    personal.health.some(({ id }) => id === selectedId)
  ) {
    return "health";
  }
  if (
    selectedId === "location" ||
    selectedId?.startsWith("demo-route-") ||
    personal.route.some(({ id }) => id === selectedId)
  ) {
    return "location";
  }
  if (
    selectedId === "checkups" ||
    selectedId?.startsWith("demo-checkup-") ||
    personal.checkups.some(({ id }) => id === selectedId)
  ) {
    return "checkups";
  }
  return "activity";
};
export const SourceLine = ({
  data,
  locale,
  sourceId,
}: {
  data: DashboardDemoData;
  locale: DashboardLocale;
  sourceId: string;
}): ReactNode => {
  const source = data.sources.find(({ id }) => id === sourceId);

  return (
    <Muted>
      {locale === "zh" ? "示例来源：" : "Sample source: "}
      {source
        ? source.name[locale]
        : locale === "zh"
          ? "未配置"
          : "Not configured"}
      {source && (
        <>
          {" · "}
          {freshnessLabel(source.freshness, locale)}
          {" · "}
          {locale === "zh" ? "接收于 " : "Received "}
          {formatDateTime(source.fetchedAt, locale, data.timeZone)}
        </>
      )}
    </Muted>
  );
};
