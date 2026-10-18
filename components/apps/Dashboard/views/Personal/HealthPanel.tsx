import { type ReactNode, useState } from "react";
import {
  ActionButton,
  Card,
  EmptyState,
  Field,
  formatDateTime,
  formatNumber,
  freshnessLabel,
  Metric,
  MetricGrid,
  MiniChart,
  Muted,
  Section,
  SectionHeading,
  Stack,
  StatusBadge,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  type PanelProps,
  SourceLine,
} from "components/apps/Dashboard/views/Personal/common";

const HealthPanel = ({
  data,
  locale,
  onEdit,
  onNavigate,
  previewMode,
  selectedId,
}: PanelProps): ReactNode => {
  const [range, setRange] = useState("week");
  const zh = locale === "zh";
  const metric =
    data.personal.health.find(({ id }) => id === selectedId) ||
    data.personal.health[0];
  const rangeStart =
    Date.parse(data.now) - (range === "day" ? 1 : 7) * 86_400_000;
  const points =
    metric?.points.filter(
      ({ at }) => range === "all" || Date.parse(at) >= rangeStart
    ) || [];
  const unit = metric?.unit === "steps" && zh ? "步" : metric?.unit;

  if (!metric) {
    return (
      <EmptyState
        description={
          zh
            ? "返回全部示例可以查看和调整逐项公开预览。"
            : "Return to all samples to view and adjust preview rules."
        }
        title={zh ? "此预览暂无健康指标" : "No health metrics in this preview"}
      />
    );
  }

  return (
    <Section aria-label={zh ? "日常健康" : "Daily health"}>
      <Toolbar>
        <Field>
          {zh ? "健康指标" : "Health metric"}
          <select
            onChange={(event) => onNavigate("personal", event.target.value)}
            value={metric.id}
          >
            {data.personal.health.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {zh ? "趋势范围" : "Trend range"}
          <select
            onChange={(event) => setRange(event.target.value)}
            value={range}
          >
            <option value="day">{zh ? "近 24 小时" : "Last 24 hours"}</option>
            <option value="week">{zh ? "近 7 天" : "Last 7 days"}</option>
            <option value="all">
              {zh ? "全部可见样本" : "All visible samples"}
            </option>
          </select>
        </Field>
      </Toolbar>
      <MetricGrid>
        <Metric
          detail={freshnessLabel(metric.freshness, locale)}
          label={zh ? "最近记录" : "Latest record"}
          unit={unit}
          value={formatNumber(metric.value, locale)}
        />
        <Metric
          detail={zh ? "只统计当前趋势范围" : "Within the selected trend range"}
          label={zh ? "有效样本" : "Available samples"}
          value={points.filter(({ value }) => value !== null).length}
        />
        <Metric
          detail={zh ? "缺测不会补成 0" : "Missing values stay missing"}
          label={zh ? "缺少样本" : "Missing samples"}
          value={points.filter(({ value }) => value === null).length}
        />
      </MetricGrid>
      <Card>
        <Stack>
          <SectionHeading>
            <h3>{metric.label[locale]}</h3>
            {previewMode !== "visitor" && (
              <ActionButton
                onClick={() => onEdit({ id: metric.id, kind: "health" })}
                type="button"
              >
                {zh ? "编辑健康示例" : "Edit health sample"}
              </ActionButton>
            )}
          </SectionHeading>
          <StatusBadge
            label={freshnessLabel(metric.freshness, locale)}
            tone={metric.freshness === "stale" ? "warning" : "neutral"}
          />
          <Muted>{metric.note[locale]}</Muted>
          <Muted>
            {zh ? "测量时间：" : "Observed: "}
            {formatDateTime(metric.observedAt, locale, data.timeZone)} ·{" "}
            {data.timeZone}
          </Muted>
          <MiniChart
            label={metric.label[locale]}
            locale={locale}
            points={points}
            timeZone={data.timeZone}
            unit={unit}
          />
          {points.length === 0 && (
            <Muted>
              {zh
                ? "所选范围没有提供样本；可调整范围或编辑合成记录。"
                : "No samples in this range; change the range or edit the synthetic record."}
            </Muted>
          )}
          {metric.goal !== null && (
            <Muted>
              {zh ? "示例目标：" : "Sample goal: "}
              {formatNumber(metric.goal, locale)} {unit}
              {zh ? "；仅为演示设定。" : "; a demonstration setting."}
            </Muted>
          )}
          <SourceLine data={data} locale={locale} sourceId={metric.sourceId} />
        </Stack>
      </Card>
      <Muted>
        {zh
          ? "所有健康数值均为合成示例，用于演示记录与趋势，不提供诊断。"
          : "All values are synthetic examples of records and trends, without diagnosis."}
      </Muted>
    </Section>
  );
};

export default HealthPanel;
