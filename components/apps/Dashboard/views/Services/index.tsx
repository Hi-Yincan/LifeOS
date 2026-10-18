import { type ReactNode, useState } from "react";
import {
  type DashboardViewProps,
  type HealthStatus,
  type Service,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  EmptyState,
  Field,
  formatDateTime,
  freshnessLabel,
  healthLabel,
  localize,
  Muted,
  Section,
  SectionHeading,
  Stack,
  Toolbar,
} from "components/apps/Dashboard/shared";
import Detail from "components/apps/Dashboard/views/Services/Detail";
import {
  categories,
  messages,
} from "components/apps/Dashboard/views/Services/messages";
import ServiceStatus from "components/apps/Dashboard/views/Services/ServiceStatus";
import {
  ServiceList,
  ServiceName,
  ServiceRow,
} from "components/apps/Dashboard/views/Services/styles";

type StatusFilter =
  "all" | "stale" | "unavailable" | "unmonitored" | HealthStatus;
const healthStatuses: HealthStatus[] = [
  "up",
  "degraded",
  "down",
  "pending",
  "maintenance",
  "unknown",
];

const matchesStatus = (service: Service, status: StatusFilter): boolean => {
  if (status === "all") return true;
  if (status === "unmonitored") return service.monitor === null;
  if (!service.monitor) return false;
  if (status === "stale" || status === "unavailable") {
    return service.freshness === status;
  }
  if (status === "pending") return service.health === "pending";
  if (status === "unknown") {
    return service.health === "unknown";
  }
  return service.health === status && service.freshness === "fresh";
};

const Services = (props: DashboardViewProps): ReactNode => {
  const { data, locale, onNavigate, selectedId } = props;
  const t = messages[locale];
  const [category, setCategory] = useState<"all" | Service["category"]>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const selected = data.services.find(({ id }) => id === selectedId);
  const term = search.trim().toLocaleLowerCase();
  const filtered = data.services.filter(
    (service) =>
      (category === "all" || service.category === category) &&
      matchesStatus(service, status) &&
      [service.name.zh, service.name.en].some((name) =>
        name.toLocaleLowerCase().includes(term)
      )
  );
  const resetFilters = (): void => {
    setCategory("all");
    setSearch("");
    setStatus("all");
  };

  if (selected) {
    return <Detail key={selected.id} {...props} service={selected} />;
  }
  if (selectedId) {
    return (
      <Section>
        <EmptyState title={t.notFound} />
        <Toolbar>
          <ActionButton onClick={() => onNavigate("services")} type="button">
            {t.back}
          </ActionButton>
        </Toolbar>
      </Section>
    );
  }

  return (
    <Section aria-label={t.title}>
      <SectionHeading>
        <h2>{t.title}</h2>
        <Muted role="status">
          {filtered.length} {t.visibleCount}
        </Muted>
      </SectionHeading>
      <Toolbar aria-label={t.filters} role="group">
        <Field>
          {t.search}
          <input
            onChange={({ target }) => setSearch(target.value)}
            type="search"
            value={search}
          />
        </Field>
        <Field>
          {t.status}
          <select
            onChange={({ target }) => setStatus(target.value as StatusFilter)}
            value={status}
          >
            <option value="all">{t.allStates}</option>
            {healthStatuses.map((value) => (
              <option key={value} value={value}>
                {healthLabel(value, locale)}
              </option>
            ))}
            <option value="stale">{freshnessLabel("stale", locale)}</option>
            <option value="unavailable">
              {freshnessLabel("unavailable", locale)}
            </option>
            <option value="unmonitored">{t.unmonitored}</option>
          </select>
        </Field>
        {(category !== "all" || search || status !== "all") && (
          <ActionButton onClick={resetFilters} type="button">
            {t.clear}
          </ActionButton>
        )}
      </Toolbar>
      <Toolbar aria-label={t.category} role="group">
        {Object.entries(categories).map(([value, label]) => (
          <ActionButton
            key={value}
            aria-pressed={category === value}
            onClick={() =>
              setCategory(
                category === value ? "all" : (value as Service["category"])
              )
            }
            type="button"
          >
            {localize(label, locale)}
          </ActionButton>
        ))}
      </Toolbar>
      {data.services.length === 0 ? (
        <EmptyState description={t.noServicesHint} title={t.noServices} />
      ) : filtered.length === 0 ? (
        <EmptyState description={t.noMatchesHint} title={t.noMatches} />
      ) : (
        <ServiceList>
          {filtered.map((service) => (
            <ServiceRow key={service.id}>
              <Stack>
                <ServiceName
                  onClick={() => onNavigate("services", service.id)}
                  type="button"
                >
                  {localize(service.name, locale)}
                </ServiceName>
                <p>{localize(service.description, locale)}</p>
                <Muted>{localize(categories[service.category], locale)}</Muted>
              </Stack>
              <Stack>
                <ServiceStatus locale={locale} service={service} />
                <Muted>
                  {t.observedAt}:{" "}
                  {formatDateTime(service.observedAt, locale, data.timeZone)} (
                  {data.timeZone})
                </Muted>
                {service.monitor && (
                  <Muted>
                    {localize(service.monitor.location, locale)} ·{" "}
                    {service.monitor.method}
                  </Muted>
                )}
              </Stack>
            </ServiceRow>
          ))}
        </ServiceList>
      )}
    </Section>
  );
};

export default Services;
