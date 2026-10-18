import { type ReactNode, useState } from "react";
import {
  type DashboardViewProps,
  type DemoPrivacyPolicy,
  type LocalizedText,
  type PersonalMetricId,
} from "components/apps/Dashboard/model";
import {
  Field,
  getDemoCalendarWindow,
  Muted,
  Notice,
  Stack,
  Toolbar,
} from "components/apps/Dashboard/shared";
import { Disclosure } from "components/apps/Dashboard/views/Personal/styles";

const metrics: { id: PersonalMetricId; label: LocalizedText }[] = [
  { id: "activity", label: { en: "Activity", zh: "活动" } },
  { id: "schedule", label: { en: "Schedule", zh: "日程" } },
  { id: "location", label: { en: "Location and route", zh: "位置与轨迹" } },
  { id: "steps", label: { en: "Steps", zh: "步数" } },
  { id: "heartRate", label: { en: "Heart rate", zh: "心率" } },
  { id: "sleep", label: { en: "Sleep", zh: "睡眠" } },
  { id: "weight", label: { en: "Weight", zh: "体重" } },
  { id: "checkups", label: { en: "Checkup records", zh: "检查记录" } },
];
const PrivacyPreview = ({
  data,
  locale,
  onUpdate,
  previewMode,
  selectedId,
}: DashboardViewProps): ReactNode => {
  const [metric, setMetric] = useState<PersonalMetricId>(
    () => metrics.find(({ id }) => id === selectedId)?.id || "activity"
  );
  const [notice, setNotice] = useState("");
  const policy = data.personal.policies[metric];
  const window = getDemoCalendarWindow(policy, data.now);
  const zh = locale === "zh";
  const change = (patch: Partial<DemoPrivacyPolicy>): void => {
    onUpdate((previous) => ({
      ...previous,
      personal: {
        ...previous.personal,
        policies: {
          ...previous.personal.policies,
          [metric]: { ...previous.personal.policies[metric], ...patch },
        },
      },
    }));
    setNotice(
      zh
        ? "已更新本窗口预览规则，未发布。"
        : "Preview rule updated for this window; nothing published."
    );
  };

  if (previewMode === "visitor") {
    return (
      <Notice>
        {zh
          ? "当前是只读访客预览。返回“全部示例”可编辑记录与公开规则；这里没有发布任何数据。"
          : "Read-only visitor preview. Return to All samples to edit records and rules; no data has been published."}
      </Notice>
    );
  }

  return (
    <Disclosure>
      <summary>
        {zh ? "逐项公开预览规则（示例）" : "Per-item visibility rules (demo)"}
      </summary>
      <Stack>
        <Notice>
          {zh
            ? "选择每项的展示范围，然后使用窗口顶部的访客预览查看效果。仅前端演示，规则不构成真实权限，也不会发布数据。"
            : "Choose each item's range, then use Visitor preview at the top of the window. These frontend demo rules do not authorize or publish real data."}
        </Notice>
        <Toolbar>
          <Field>
            {zh ? "预览项目" : "Preview item"}
            <select
              onChange={(event) => {
                setMetric(event.target.value as PersonalMetricId);
                setNotice("");
              }}
              value={metric}
            >
              {metrics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label[locale]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            {zh ? "访客可见性" : "Visitor visibility"}
            <select
              onChange={(event) =>
                change({
                  visibility: event.target
                    .value as DemoPrivacyPolicy["visibility"],
                })
              }
              value={policy.visibility}
            >
              <option value="private">{zh ? "不展示" : "Hidden"}</option>
              <option value="public">
                {zh ? "在预览中展示" : "Show in preview"}
              </option>
            </select>
          </Field>
          <Field>
            {zh ? "历史窗口" : "History window"}
            <select
              onChange={(event) =>
                change({
                  history: event.target.value as DemoPrivacyPolicy["history"],
                })
              }
              value={policy.history}
            >
              <option value="day">{zh ? "一天" : "One day"}</option>
              <option value="threeDays">{zh ? "三天" : "Three days"}</option>
              <option value="month">
                {zh ? "一个月" : "One calendar month"}
              </option>
              <option value="all">{zh ? "全部历史" : "All history"}</option>
            </select>
          </Field>
          <Field>
            {zh ? "延迟展示" : "Visibility delay"}
            <select
              onChange={(event) =>
                change({
                  delayDays: Number(
                    event.target.value
                  ) as DemoPrivacyPolicy["delayDays"],
                })
              }
              value={policy.delayDays}
            >
              <option value="0">{zh ? "不延迟" : "No delay"}</option>
              <option value="1">{zh ? "隐藏今日" : "Hide today"}</option>
              <option value="7">{zh ? "延迟七天" : "Seven days"}</option>
            </select>
          </Field>
        </Toolbar>
        <Muted>
          {zh ? "演示 UTC 范围：" : "Demo UTC window: "}
          {window.from || (zh ? "不限开始时间" : "No start limit")} →{" "}
          {window.toExclusive}
          {zh
            ? "（不包含截止时刻）。历史窗口以允许展示的最新日期计算。无延迟的未来日程仍作为计划展示。"
            : " (end excluded). History is anchored to the latest allowed date. Future events remain visible as plans when there is no delay."}
        </Muted>
        {policy.visibility === "private" && (
          <Muted>
            {zh
              ? "此项目已隐藏，设置的时间范围暂不展示。"
              : "This item is hidden regardless of its time window."}
          </Muted>
        )}
        {notice && <p role="status">{notice}</p>}
      </Stack>
    </Disclosure>
  );
};

export default PrivacyPreview;
