import { type ReactNode, useState } from "react";
import { type DashboardLocale } from "components/apps/Dashboard/model";
import { formatNumber } from "components/apps/Dashboard/shared";
import {
  type HealthDay,
  type HealthSummary,
} from "components/apps/Dashboard/views/Services/health";
import { messages } from "components/apps/Dashboard/views/Services/messages";
import {
  HealthBar,
  HealthHelp,
  HealthStrip,
  HealthTooltip,
  HealthTrack,
  UptimeSummary,
} from "components/apps/Dashboard/views/Services/styles";

const percent = (value: null | number, locale: DashboardLocale): string =>
  value === null
    ? "—"
    : `${formatNumber(value, locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;

export const UptimeValue = ({
  locale,
  summary,
}: {
  locale: DashboardLocale;
  summary: HealthSummary;
}): ReactNode => {
  const t = messages[locale];

  return (
    <UptimeSummary aria-label={t.uptime}>
      <strong>
        <span>{t.uptimeLabel} </span>
        {percent(summary.uptimePercent, locale)}
      </strong>
      <span
        title={`${summary.observed} / ${summary.expected} ${t.observedSamples}`}
      >
        {t.coverage} {percent(summary.coveragePercent, locale)}
      </span>
    </UptimeSummary>
  );
};

export const HealthTimeline = ({
  locale,
  name,
  summary,
}: {
  locale: DashboardLocale;
  name: string;
  summary: HealthSummary;
}): ReactNode => {
  const t = messages[locale];
  const [selected, setSelected] = useState(summary.days.length - 1);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const day = summary.days[selected];
  const detail = (value: HealthDay): string => {
    const state =
      t[
        value.state === "unknown"
          ? "missingSamples"
          : value.state === "up"
            ? "healthyDay"
            : value.state === "down"
              ? "outageDay"
              : "degradedDay"
      ];
    const samples =
      value.observed > 0
        ? `${t.healthySamples} ${value.up}/${value.observed}`
        : t.noObservations;
    const coverage =
      value.expected > 0 ? `${value.observed}/${value.expected}` : "—";

    return `${value.date} UTC · ${state} · ${samples} · ${t.coverage} ${coverage}`;
  };
  const active = (focused || hovered) && !dismissed;

  return (
    <HealthTrack>
      <HealthStrip
        aria-label={`${name} · ${t.healthHistory}`}
        aria-orientation="horizontal"
        aria-valuemax={summary.days.length}
        aria-valuemin={1}
        aria-valuenow={selected + 1}
        aria-valuetext={detail(day)}
        onBlur={() => {
          setFocused(false);
          setHovered(false);
        }}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDismissed(true);
            return;
          }
          const moves: Record<string, number> = {
            ArrowDown: -1,
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: 1,
          };

          if (
            event.key === "Home" ||
            event.key === "End" ||
            event.key in moves
          ) {
            event.preventDefault();
            setDismissed(false);
            if (event.key === "Home") setSelected(0);
            else if (event.key === "End") setSelected(summary.days.length - 1);
            else {
              setSelected((previous) =>
                Math.max(
                  0,
                  Math.min(summary.days.length - 1, previous + moves[event.key])
                )
              );
            }
          }
        }}
        onPointerDown={(event) => {
          event.currentTarget.focus();
          setDismissed(false);
          const bounds = event.currentTarget.getBoundingClientRect();

          if (bounds.width > 0) {
            setSelected(
              Math.max(
                0,
                Math.min(
                  summary.days.length - 1,
                  Math.floor(
                    ((event.clientX - bounds.left) / bounds.width) *
                      summary.days.length
                  )
                )
              )
            );
          }
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();

          setHovered(true);
          setDismissed(false);
          if (bounds.width > 0) {
            setSelected(
              Math.max(
                0,
                Math.min(
                  summary.days.length - 1,
                  Math.floor(
                    ((event.clientX - bounds.left) / bounds.width) *
                      summary.days.length
                  )
                )
              )
            );
          }
        }}
        role="slider"
        tabIndex={0}
      >
        {summary.days.map((item, index) => (
          <HealthBar
            key={item.date}
            $active={active && selected === index}
            $state={item.state}
            aria-hidden="true"
            data-date={item.date}
            data-health={item.state}
          />
        ))}
      </HealthStrip>
      {active && <HealthTooltip role="status">{detail(day)}</HealthTooltip>}
    </HealthTrack>
  );
};

export const HealthHistoryHelp = ({
  locale,
  summary,
}: {
  locale: DashboardLocale;
  summary: HealthSummary;
}): ReactNode => {
  const t = messages[locale];

  return (
    <HealthHelp>
      <summary>
        {t.healthHistory} · {summary.days[0].date} —{" "}
        {summary.days[summary.days.length - 1].date} UTC
      </summary>
      <p>{t.healthCalculation}</p>
      <p>{t.healthLegend}</p>
      <p>{t.healthInteraction}</p>
    </HealthHelp>
  );
};
