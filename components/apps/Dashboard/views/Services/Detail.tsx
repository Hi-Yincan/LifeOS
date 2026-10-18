import { type ReactNode, useState } from "react";
import {
  type DashboardViewProps,
  type Service,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  Card,
  EmptyState,
  formatDateTime,
  formatNumber,
  localize,
  Metric,
  MetricGrid,
  MiniChart,
  Muted,
  Notice,
  Section,
  SectionHeading,
  Split,
  Stack,
  StatusBadge,
  Toolbar,
} from "components/apps/Dashboard/shared";
import Editor, {
  type ServiceDraft,
} from "components/apps/Dashboard/views/Services/Editor";
import { summarizeHealthHistory } from "components/apps/Dashboard/views/Services/health";
import {
  HealthHistoryHelp,
  HealthTimeline,
  UptimeValue,
} from "components/apps/Dashboard/views/Services/HealthHistory";
import {
  categories,
  messages,
} from "components/apps/Dashboard/views/Services/messages";
import ServiceStatus from "components/apps/Dashboard/views/Services/ServiceStatus";
import {
  EventDetails,
  Facts,
} from "components/apps/Dashboard/views/Services/styles";

const Detail = ({
  data,
  locale,
  onDirtyChange,
  onNavigate,
  onUpdate,
  previewMode,
  service,
}: DashboardViewProps & { service: Service }): ReactNode => {
  const t = messages[locale];
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState(12);
  const source = data.sources.find(({ id }) => id === service.sourceId);
  const server = data.servers.find(({ id }) => id === service.serverId);
  const date = (value: null | string): string =>
    formatDateTime(value, locale, data.timeZone);
  const points = service.history.filter(
    ({ at }) => Date.parse(at) >= Date.parse(data.now) - hours * 3_600_000
  );
  const events = [...service.events].sort((first, second) =>
    second.startedAt.localeCompare(first.startedAt)
  );
  const canEdit = previewMode !== "visitor";
  const healthSummary = summarizeHealthHistory(service.healthHistory, data.now);
  const save = (draft: ServiceDraft): void => {
    onUpdate((previous) => ({
      ...previous,
      services: previous.services.map((item) =>
        item.id === service.id ? { ...item, ...draft } : item
      ),
    }));
    setEditing(false);
    setSaved(true);
  };
  let observationHint = "";

  if (!service.monitor) observationHint = t.unmonitoredHint;
  else if (service.freshness === "unavailable") {
    observationHint = t.collectionFailure;
  } else if (service.freshness === "stale") observationHint = t.staleHint;
  else if (service.health === "pending") observationHint = t.pendingHint;
  else if (service.health === "unknown" || service.freshness === "unknown") {
    observationHint = t.unknownHint;
  }

  return (
    <Section aria-label={t.detail}>
      <SectionHeading>
        <h2>{localize(service.name, locale)}</h2>
        <Toolbar>
          <ActionButton onClick={() => onNavigate("services")} type="button">
            {t.back}
          </ActionButton>
          {canEdit && !editing && (
            <ActionButton
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
              type="button"
            >
              {t.edit}
            </ActionButton>
          )}
        </Toolbar>
      </SectionHeading>
      {saved && <Notice role="status">{t.saved}</Notice>}
      {!canEdit && <Notice>{t.readonly}</Notice>}
      {editing && canEdit ? (
        <Editor
          locale={locale}
          onCancel={() => {
            onDirtyChange?.(false);
            setEditing(false);
          }}
          onDirtyChange={onDirtyChange}
          onSave={save}
          servers={data.servers}
          service={service}
        />
      ) : (
        <>
          <p>{localize(service.description, locale)}</p>
          <Toolbar>
            <StatusBadge
              label={localize(categories[service.category], locale)}
            />
            <ServiceStatus locale={locale} service={service} />
          </Toolbar>
          {observationHint && <Notice>{observationHint}</Notice>}
          <Card>
            <Stack>
              <SectionHeading>
                <h3>{t.uptime}</h3>
                <UptimeValue locale={locale} summary={healthSummary} />
              </SectionHeading>
              <HealthTimeline
                locale={locale}
                name={localize(service.name, locale)}
                summary={healthSummary}
              />
              <HealthHistoryHelp locale={locale} summary={healthSummary} />
            </Stack>
          </Card>
          <Split>
            <Card>
              <Stack>
                <h3>{t.source}</h3>
                <Facts>
                  <dt>{t.source}</dt>
                  <dd>
                    {service.monitor && source
                      ? localize(source.name, locale)
                      : t.sourceMissing}
                  </dd>
                  <dt>{t.method}</dt>
                  <dd>{service.monitor?.method || t.unmonitored}</dd>
                  <dt>{t.location}</dt>
                  <dd>
                    {service.monitor
                      ? localize(service.monitor.location, locale)
                      : "—"}
                  </dd>
                  <dt>{t.interval}</dt>
                  <dd>
                    {service.monitor
                      ? `${formatNumber(service.monitor.intervalSeconds, locale)} ${t.seconds}`
                      : "—"}
                  </dd>
                  <dt>{t.server}</dt>
                  <dd>
                    {server ? (
                      <ActionButton
                        onClick={() => onNavigate("servers", server.id)}
                        type="button"
                      >
                        {localize(server.name, locale)}
                      </ActionButton>
                    ) : (
                      t.noServer
                    )}
                  </dd>
                </Facts>
                {service.monitor && source && (
                  <Muted>{localize(source.note, locale)}</Muted>
                )}
              </Stack>
            </Card>
            <Card>
              <Stack>
                <h3>
                  {t.times} ({data.timeZone})
                </h3>
                <Facts>
                  <dt>{t.observedAt}</dt>
                  <dd>{date(service.observedAt)}</dd>
                  <dt>{t.sourceUpdatedAt}</dt>
                  <dd>{date(service.sourceUpdatedAt)}</dd>
                  <dt>{t.fetchedAt}</dt>
                  <dd>{date(service.fetchedAt)}</dd>
                </Facts>
              </Stack>
            </Card>
          </Split>
          {service.monitor && (
            <MetricGrid>
              <Metric
                label={t.latency}
                unit={service.latencyMs === null ? undefined : "ms"}
                value={formatNumber(service.latencyMs, locale)}
              />
            </MetricGrid>
          )}
          <Card>
            <Stack>
              <h3>{t.entry}</h3>
              <p>{service.url || t.entryMissing}</p>
              <Muted>{t.entryHint}</Muted>
            </Stack>
          </Card>
          {service.monitor && (
            <Card>
              <Stack>
                <Toolbar aria-label={t.history} role="group">
                  <ActionButton
                    aria-pressed={hours === 6}
                    onClick={() => setHours(6)}
                    type="button"
                  >
                    {t.sixHours}
                  </ActionButton>
                  <ActionButton
                    aria-pressed={hours === 12}
                    onClick={() => setHours(12)}
                    type="button"
                  >
                    {t.twelveHours}
                  </ActionButton>
                </Toolbar>
                <MiniChart
                  label={t.history}
                  locale={locale}
                  points={points}
                  timeZone={data.timeZone}
                  unit="ms"
                />
                <Muted>{t.historyHint}</Muted>
              </Stack>
            </Card>
          )}
          <Section aria-label={t.events}>
            <h3>{t.events}</h3>
            {events.length > 0 ? (
              <>
                <Muted>{t.eventDetail}</Muted>
                {events.map((event) => {
                  const eventStatus =
                    Date.parse(event.startedAt) > Date.parse(data.now)
                      ? t.planned
                      : event.endedAt &&
                          Date.parse(event.endedAt) <= Date.parse(data.now)
                        ? t.completed
                        : t.ongoing;

                  return (
                    <EventDetails key={event.id}>
                      <summary>
                        {localize(event.title, locale)} · {t[event.kind]} ·{" "}
                        {eventStatus}
                      </summary>
                      <p>{localize(event.summary, locale)}</p>
                      <Facts>
                        <dt>
                          {t.startedAt} ({data.timeZone})
                        </dt>
                        <dd>{date(event.startedAt)}</dd>
                        <dt>
                          {t.endedAt} ({data.timeZone})
                        </dt>
                        <dd>
                          {event.endedAt ? date(event.endedAt) : t.ongoing}
                        </dd>
                      </Facts>
                    </EventDetails>
                  );
                })}
              </>
            ) : (
              <EmptyState title={t.eventEmpty} />
            )}
          </Section>
        </>
      )}
    </Section>
  );
};

export default Detail;
