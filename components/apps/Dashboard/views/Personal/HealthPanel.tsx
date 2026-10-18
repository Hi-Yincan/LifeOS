import { type ReactNode, useState } from "react";
import {
  Card,
  EmptyState,
  Field,
  formatDateTime,
  formatNumber,
  freshnessLabel,
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
import {
  HealthGrid,
  HealthRecordDetails,
  HealthSampleCounts,
  HealthValue,
} from "components/apps/Dashboard/views/Personal/styles";

const HealthPanel = ({ data, locale }: PanelProps): ReactNode => {
  const [range, setRange] = useState("week");
  const zh = locale === "zh";
  const rangeStart =
    Date.parse(data.now) - (range === "day" ? 1 : 7) * 86_400_000;

  if (data.personal.health.length === 0) {
    return (
      <EmptyState
        description={
          zh ? "当前还没有健康记录。" : "There are no health records yet."
        }
        title={zh ? "暂无健康指标" : "No health metrics"}
      />
    );
  }

  return (
    <Section aria-label={zh ? "日常健康" : "Daily health"}>
      <Toolbar>
        <Field>
          {zh ? "趋势范围" : "Trend range"}
          <select
            onChange={(event) => setRange(event.target.value)}
            value={range}
          >
            <option value="day">{zh ? "近 24 小时" : "Last 24 hours"}</option>
            <option value="week">{zh ? "近 7 天" : "Last 7 days"}</option>
            <option value="all">{zh ? "全部样本" : "All samples"}</option>
          </select>
        </Field>
        <Muted>{zh ? "同时展示全部指标" : "Showing all health metrics"}</Muted>
      </Toolbar>
      <HealthGrid>
        {data.personal.health.map((metric) => {
          const points = metric.points.filter(
            ({ at }) => range === "all" || Date.parse(at) >= rangeStart
          );
          const unit = metric.unit === "steps" && zh ? "步" : metric.unit;

          return (
            <Card
              key={metric.id}
              aria-label={metric.label[locale]}
              as="article"
              data-health-metric={metric.id}
            >
              <Stack>
                <SectionHeading>
                  <h3>{metric.label[locale]}</h3>
                  <StatusBadge
                    label={freshnessLabel(metric.freshness, locale)}
                    tone={metric.freshness === "stale" ? "warning" : "neutral"}
                  />
                </SectionHeading>
                <HealthValue>
                  <strong>{formatNumber(metric.value, locale)}</strong>
                  <span>{unit}</span>
                  <Muted>{zh ? "最近记录" : "Latest record"}</Muted>
                </HealthValue>
                <Muted>
                  {zh ? "测量时间：" : "Observed: "}
                  {formatDateTime(
                    metric.observedAt,
                    locale,
                    data.timeZone
                  )} · {data.timeZone}
                </Muted>
                <MiniChart
                  label={metric.label[locale]}
                  locale={locale}
                  points={points}
                  timeZone={data.timeZone}
                  unit={unit}
                />
                <HealthSampleCounts>
                  <span>
                    {zh ? "有效样本" : "Available samples"}{" "}
                    <strong>
                      {points.filter(({ value }) => value !== null).length}
                    </strong>
                  </span>
                  <span>
                    {zh ? "缺少样本" : "Missing samples"}{" "}
                    <strong>
                      {points.filter(({ value }) => value === null).length}
                    </strong>
                  </span>
                </HealthSampleCounts>
                {points.length === 0 && (
                  <Muted>
                    {zh
                      ? "所选范围暂无样本；没有记录不代表数值为 0。"
                      : "No samples in this range; an absent record is not zero."}
                  </Muted>
                )}
                <HealthRecordDetails>
                  <summary>
                    {zh ? "记录说明与来源" : "Record notes and source"}
                  </summary>
                  <Stack>
                    <Muted>{metric.note[locale]}</Muted>
                    {metric.goal !== null && (
                      <Muted>
                        {zh ? "示例目标：" : "Sample goal: "}
                        {formatNumber(metric.goal, locale)} {unit}
                        {zh ? "；仅为演示设定。" : "; a demonstration setting."}
                      </Muted>
                    )}
                    <SourceLine
                      data={data}
                      locale={locale}
                      sourceId={metric.sourceId}
                    />
                  </Stack>
                </HealthRecordDetails>
              </Stack>
            </Card>
          );
        })}
      </HealthGrid>
      <Muted>
        {zh
          ? "所有健康数值均为合成示例，用于演示记录与趋势，不提供诊断。"
          : "All values are synthetic examples of records and trends, without diagnosis."}
      </Muted>
    </Section>
  );
};

export default HealthPanel;
