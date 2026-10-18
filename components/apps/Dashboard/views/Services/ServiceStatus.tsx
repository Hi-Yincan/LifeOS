import { type ReactNode } from "react";
import {
  type DashboardLocale,
  type Service,
} from "components/apps/Dashboard/model";
import {
  type BadgeTone,
  freshnessLabel,
  healthLabel,
  StatusBadge,
  Toolbar,
} from "components/apps/Dashboard/shared";
import { messages } from "components/apps/Dashboard/views/Services/messages";

const healthTones: Record<Service["health"], BadgeTone> = {
  degraded: "warning",
  down: "danger",
  maintenance: "neutral",
  pending: "warning",
  unknown: "neutral",
  up: "success",
};

const ServiceStatus = ({
  locale,
  service,
}: {
  locale: DashboardLocale;
  service: Service;
}): ReactNode => {
  const t = messages[locale];

  if (!service.monitor) return <StatusBadge label={t.unmonitored} />;

  const current = service.freshness === "fresh";
  const historical = !current && service.observedAt !== null;
  const status = healthLabel(service.health, locale);

  return (
    <Toolbar>
      <StatusBadge
        label={historical ? `${t.lastStatus}: ${status}` : status}
        tone={current ? healthTones[service.health] : "neutral"}
      />
      {!current && (
        <StatusBadge
          label={freshnessLabel(service.freshness, locale)}
          tone="warning"
        />
      )}
    </Toolbar>
  );
};

export default ServiceStatus;
