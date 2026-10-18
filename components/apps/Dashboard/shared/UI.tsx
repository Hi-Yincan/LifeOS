import { type ReactNode } from "react";
import styled from "styled-components";
import {
  type ChartPoint,
  type DashboardLocale,
} from "components/apps/Dashboard/model";
import { getChartGeometry } from "components/apps/Dashboard/shared/chart";
import {
  formatDateTime,
  formatNumber,
} from "components/apps/Dashboard/shared/format";
import {
  Card,
  DataTable,
  Muted,
} from "components/apps/Dashboard/shared/styles";

export type BadgeTone = "danger" | "neutral" | "success" | "warning";
const StyledBadge = styled.span<{ $tone: BadgeTone }>`
  border: 1px solid var(--hyc-line);
  color: ${({ $tone }) => ({ danger: "#ecadad", neutral: "var(--hyc-muted)", success: "#a2d4af", warning: "#e9c67a" })[$tone]};
  display: inline-block;
  font-size: 11px;
  justify-self: start;
  max-width: 100%;
  padding: 1px 5px;
  width: fit-content;
`;
export const StatusBadge = ({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: BadgeTone;
}): ReactNode => <StyledBadge $tone={tone}>{label}</StyledBadge>;
const StyledEmpty = styled.div`
  border: 1px solid var(--hyc-line);
  display: grid;
  gap: 6px;
  padding: 24px 12px;
  text-align: center;
`;
export const EmptyState = ({
  description,
  title,
}: {
  description?: string;
  title: string;
}): ReactNode => (
  <StyledEmpty role="status">
    <p>{title}</p>
    {description && <Muted>{description}</Muted>}
  </StyledEmpty>
);
const MetricValue = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 6px 0;

  strong {
    font-size: 22px;
    font-variant-numeric: tabular-nums;
    font-weight: 400;
  }
`;
export const Metric = ({
  detail,
  label,
  unit,
  value,
}: {
  detail?: ReactNode;
  label: string;
  unit?: string;
  value: ReactNode;
}): ReactNode => (
  <Card>
    <Muted>{label}</Muted>
    <MetricValue>
      <strong>{value}</strong>
      {unit && <Muted>{unit}</Muted>}
    </MetricValue>
    {detail && <Muted>{detail}</Muted>}
  </Card>
);
const Chart = styled.figure`
  display: grid;
  gap: 6px;
  margin: 0;
  min-width: 0;

  svg {
    height: 90px;
    overflow: visible;
    width: 100%;
  }

  figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
  }

  details {
    color: var(--hyc-muted);
  }

  summary {
    cursor: pointer;
    width: fit-content;
  }
`;
export const MiniChart = ({
  label,
  locale,
  points,
  timeZone = "UTC",
  unit = "",
}: {
  label: string;
  locale: DashboardLocale;
  points: ChartPoint[];
  timeZone?: string;
  unit?: string;
}): ReactNode => {
  const geometry = getChartGeometry(points);
  const missing = locale === "zh" ? "缺少样本" : "Missing sample";
  const range = `${formatNumber(geometry.min, locale)} – ${formatNumber(geometry.max, locale)} ${unit}`;

  return (
    <Chart>
      <figcaption>
        <span>{label}</span>
        <Muted>{range}</Muted>
      </figcaption>
      {geometry.segments.length > 0 ? (
        <svg
          aria-label={`${label}: ${range}`}
          preserveAspectRatio="none"
          role="img"
          viewBox="0 0 300 80"
        >
          <title>{label}</title>
          <path
            d="M8 72H292"
            fill="none"
            stroke="var(--hyc-line)"
            vectorEffect="non-scaling-stroke"
          />
          {geometry.segments.map((segment) =>
            segment.length === 1 ? (
              <line
                key={segment[0].at}
                stroke="var(--hyc-accent)"
                strokeLinecap="round"
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
                x1={segment[0].x}
                x2={segment[0].x}
                y1={segment[0].y}
                y2={segment[0].y}
              />
            ) : (
              <polyline
                key={segment[0].at}
                fill="none"
                points={segment.map(({ x, y }) => `${x},${y}`).join(" ")}
                stroke="var(--hyc-accent)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            )
          )}
        </svg>
      ) : (
        <Muted>
          {locale === "zh" ? "暂无可绘制样本" : "No samples to plot"}
        </Muted>
      )}
      <details>
        <summary>
          {locale === "zh"
            ? "查看样本 · 缺失处不连线"
            : "View samples · gaps stay disconnected"}
        </summary>
        <DataTable>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">
                {locale === "zh" ? "时间" : "Time"} ({timeZone})
              </th>
              <th scope="col">{locale === "zh" ? "数值" : "Value"}</th>
            </tr>
          </thead>
          <tbody>
            {points.map(({ at, value }) => (
              <tr key={at}>
                <td>{formatDateTime(at, locale, timeZone)}</td>
                <td>
                  {value === null || !Number.isFinite(value)
                    ? missing
                    : `${formatNumber(value, locale)} ${unit}`}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </details>
    </Chart>
  );
};
