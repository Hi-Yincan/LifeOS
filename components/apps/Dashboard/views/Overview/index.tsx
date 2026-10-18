import { type ReactNode, useState } from "react";
import styled from "styled-components";
import {
  type DashboardViewProps,
  type Freshness,
  type HealthStatus,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  type BadgeTone,
  Card,
  CardGrid,
  EmptyState,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
  freshnessLabel,
  healthLabel,
  localize,
  MetricGrid,
  Muted,
  Notice,
  Section,
  SectionHeading,
  Stack,
  StatusBadge,
  summarizeMemberships,
  summarizeServices,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  getOverviewQueue,
  type QueueItem,
} from "components/apps/Dashboard/views/Overview/queue";

const SummaryCard = styled(Card)`
  align-content: start;
  display: grid;
  gap: 8px;
  p {
    line-height: 1.5;
  }
`;
const Count = styled.strong`
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  font-weight: 400;
`;
const Detail = styled.div`
  display: grid;
  gap: 5px;
  line-height: 1.5;
  min-width: 0;
  overflow-wrap: anywhere;
`;
const ItemHeading = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: space-between;
`;
const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  > li {
    border-bottom: 1px solid var(--hyc-line);
    display: grid;
    gap: 5px;
    padding: 10px 0;
  }
  > li:first-child {
    padding-top: 0;
  }
  > li:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;
const SourceDetails = styled.details`
  border: 1px solid var(--hyc-line);
  padding: 10px 12px;
  summary {
    cursor: pointer;
  }
  summary:focus-visible {
    outline: 1px solid var(--hyc-accent);
  }
  &[open] > summary {
    margin-bottom: 12px;
  }
`;
const SourceFacts = styled.dl`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  margin: 4px 0;
  dt {
    color: var(--hyc-muted);
  }
  dd {
    margin: 3px 0 0;
  }
`;

const sampleTone = (freshness: Freshness): BadgeTone =>
  freshness === "fresh"
    ? "success"
    : freshness === "stale"
      ? "warning"
      : "neutral";
const statusTone = (health: HealthStatus): BadgeTone =>
  health === "down"
    ? "danger"
    : ["degraded", "pending"].includes(health)
      ? "warning"
      : "neutral";

const Overview = ({
  data,
  locale,
  onNavigate,
  previewMode,
}: DashboardViewProps): ReactNode => {
  const [queueFilter, setQueueFilter] = useState<"all" | QueueItem["kind"]>(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "servers" | "services"
  >("all");
  const text = (zh: string, en: string): string => (locale === "zh" ? zh : en);
  const membershipSummary = summarizeMemberships(data.memberships, data.now);
  const serviceSummary = summarizeServices(data.services);
  const currentActivity = data.personal.activities
    .filter(
      ({ endedAt, startedAt }) =>
        !endedAt && Date.parse(startedAt) <= Date.parse(data.now)
    )
    .sort((first, second) =>
      second.startedAt.localeCompare(first.startedAt)
    )[0];
  const activitySource = data.sources.find(
    ({ id }) => id === currentActivity?.sourceId
  );
  const nextEvent = data.personal.schedule
    .filter(
      ({ startsAt, status }) =>
        status === "planned" && Date.parse(startsAt) >= Date.parse(data.now)
    )
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt))[0];
  const queue = getOverviewQueue(data, locale);
  const visibleQueue = queue.filter(
    ({ kind }) => queueFilter === "all" || queueFilter === kind
  );
  const healthyServers = data.servers.filter(
    ({ freshness, health }) => freshness === "fresh" && health === "up"
  ).length;
  const staleServers = data.servers.filter(
    ({ freshness }) => freshness === "stale"
  ).length;
  const unknownServers = data.servers.filter(
    ({ freshness, health }) =>
      freshness === "unavailable" ||
      freshness === "unknown" ||
      health === "unknown"
  ).length;
  const measuredHealth = data.personal.health.filter(
    ({ value }) => value !== null
  ).length;
  const serviceIssues = data.services.filter(
    ({ freshness, health }) => freshness !== "fresh" || health !== "up"
  );
  const serverIssues = data.servers.filter(
    ({ freshness, health }) => freshness !== "fresh" || health !== "up"
  );
  const issues = [
    ...serviceIssues.map((service) => ({
      freshness: service.freshness,
      health: service.health,
      id: service.id,
      module: "services" as const,
      name: service.name,
      observedAt: service.observedAt,
      sourceId: service.sourceId,
    })),
    ...serverIssues.map((server) => ({
      freshness: server.freshness,
      health: server.health,
      id: server.id,
      module: "servers" as const,
      name: server.name,
      observedAt: server.lastSeenAt,
      sourceId: server.sourceId,
    })),
  ].filter(({ module }) => statusFilter === "all" || statusFilter === module);
  const queueLabels = {
    all: text("全部事项", "All items"),
    memberships: text("会员", "Memberships"),
    personal: text("日程", "Schedule"),
    servers: text("主机到期", "Host expiration"),
  };
  const statusLabels = {
    all: text("全部状态", "All statuses"),
    servers: text("服务器", "Servers"),
    services: text("服务", "Services"),
  };

  return (
    <Section aria-label={text("看板总览", "Dashboard overview")}>
      <SectionHeading>
        <h2>{text("总览", "Overview")}</h2>
        <Muted>
          {text("固定示例时间", "Fixed demo time")}:{" "}
          {formatDate(data.now, locale, data.timeZone)}{" "}
          {formatTime(data.now, locale, data.timeZone)} ({data.timeZone})
        </Muted>
      </SectionHeading>
      <MetricGrid>
        <SummaryCard>
          <ActionButton onClick={() => onNavigate("personal")} type="button">
            {text("查看个人状况", "View personal status")}
          </ActionButton>
          <Count>
            {measuredHealth} / {data.personal.health.length}
          </Count>
          <Muted>
            {text(
              "有数值的健康指标 / 可见指标",
              "Metrics with values / visible metrics"
            )}
          </Muted>
          <Muted>
            {text(
              "各指标的单位与测量时间见详情",
              "Units and observation times are shown in details"
            )}
          </Muted>
        </SummaryCard>
        <SummaryCard>
          <ActionButton onClick={() => onNavigate("memberships")} type="button">
            {text("查看会员", "View memberships")}
          </ActionButton>
          <Count>{membershipSummary.activeCount}</Count>
          <Muted>
            {text("有效或试用权益", "Active or trial entitlements")}
          </Muted>
          <Detail>
            <Muted>
              {text("续费计划月均估算", "Monthly equivalent of renewal plans")}
            </Muted>
            {membershipSummary.estimatedMonthly.length > 0 ? (
              membershipSummary.estimatedMonthly.map((amount) => (
                <span key={amount.currency}>{formatMoney(amount, locale)}</span>
              ))
            ) : (
              <span>
                {text(
                  "没有已知费用的续费计划",
                  "No renewal plans with known prices"
                )}
              </span>
            )}
            <Muted>
              {text("未知金额", "Unknown amounts")}:{" "}
              {membershipSummary.unknownAmountCount} ·{" "}
              {text("估算不代表实付", "Estimates are not payments")}
            </Muted>
          </Detail>
        </SummaryCard>
        <SummaryCard>
          <ActionButton onClick={() => onNavigate("services")} type="button">
            {text("查看服务", "View services")}
          </ActionButton>
          <Count>
            {serviceSummary.healthy} / {serviceSummary.total}
          </Count>
          <Muted>
            {text(
              "有效样本且正常 / 可见服务",
              "Current and operational / visible services"
            )}
          </Muted>
          <Muted>
            {text("异常", "Degraded/down")}: {serviceSummary.attention} ·{" "}
            {text("过期", "Stale")}: {serviceSummary.stale}
          </Muted>
          <Muted>
            {text("待确认", "Pending")}: {serviceSummary.pending} ·{" "}
            {text("未知", "Unknown")}: {serviceSummary.unknown} ·{" "}
            {text("未监测", "Unmonitored")}: {serviceSummary.unmonitored}
          </Muted>
        </SummaryCard>
        <SummaryCard>
          <ActionButton onClick={() => onNavigate("servers")} type="button">
            {text("查看服务器", "View servers")}
          </ActionButton>
          <Count>
            {healthyServers} / {data.servers.length}
          </Count>
          <Muted>
            {text(
              "有效样本且正常 / 可见主机",
              "Current and operational / visible hosts"
            )}
          </Muted>
          <Muted>
            {text("过期", "Stale")}: {staleServers} ·{" "}
            {text("未知或来源不可用", "Unknown or source unavailable")}:{" "}
            {unknownServers}
          </Muted>
        </SummaryCard>
      </MetricGrid>
      <CardGrid>
        <SummaryCard>
          <h3>{text("当前活动", "Current activity")}</h3>
          {currentActivity ? (
            <Detail>
              <ActionButton
                onClick={() => onNavigate("personal", currentActivity.id)}
                type="button"
              >
                {localize(currentActivity.title, locale)}
              </ActionButton>
              <span>
                {text("开始", "Started")}:{" "}
                {formatDateTime(
                  currentActivity.startedAt,
                  locale,
                  data.timeZone
                )}{" "}
                ({data.timeZone})
              </span>
              <Muted>
                {text("按示例时钟已持续", "Elapsed at demo time")}:{" "}
                {formatDuration(
                  (Date.parse(data.now) -
                    Date.parse(currentActivity.startedAt)) /
                    1000,
                  locale
                )}
              </Muted>
              <Muted>
                {text("来源", "Source")}:{" "}
                {activitySource
                  ? localize(activitySource.name, locale)
                  : text("未知", "Unknown")}
              </Muted>
              {activitySource && (
                <span>
                  <StatusBadge
                    label={freshnessLabel(activitySource.freshness, locale)}
                    tone={sampleTone(activitySource.freshness)}
                  />
                </span>
              )}
            </Detail>
          ) : (
            <EmptyState
              title={text(
                "没有可见的进行中活动",
                "No visible current activity"
              )}
            />
          )}
        </SummaryCard>
        <SummaryCard>
          <h3>{text("下一项日程", "Next scheduled event")}</h3>
          {nextEvent ? (
            <Detail>
              <ActionButton
                onClick={() => onNavigate("personal", nextEvent.id)}
                type="button"
              >
                {localize(nextEvent.title, locale)}
              </ActionButton>
              <span>
                {formatDateTime(nextEvent.startsAt, locale, data.timeZone)} –{" "}
                {formatDateTime(nextEvent.endsAt, locale, data.timeZone)} (
                {data.timeZone})
              </span>
              {nextEvent.location && (
                <Muted>{localize(nextEvent.location, locale)}</Muted>
              )}
              <Muted>
                {text(
                  "计划安排，未自动确认完成",
                  "A plan; completion is not confirmed automatically"
                )}
              </Muted>
            </Detail>
          ) : (
            <EmptyState
              title={text("没有可见的后续日程", "No visible upcoming events")}
            />
          )}
        </SummaryCard>
      </CardGrid>
      <Section aria-label={text("待处理事项", "Upcoming actions")}>
        <SectionHeading>
          <h3>{text("待处理事项", "Upcoming actions")}</h3>
          <Muted>
            {visibleQueue.length} / {queue.length}
          </Muted>
        </SectionHeading>
        <Toolbar
          aria-label={text("筛选事项", "Filter actions")}
          className="hyc-segments"
        >
          {(Object.keys(queueLabels) as (keyof typeof queueLabels)[]).map(
            (kind) => (
              <ActionButton
                key={kind}
                aria-pressed={queueFilter === kind}
                onClick={() => setQueueFilter(kind)}
                type="button"
              >
                {queueLabels[kind]}
              </ActionButton>
            )
          )}
        </Toolbar>
        <Muted>
          {text(
            "未来 7 天日程、30 天内续费/到期及待核对记录。日期早于示例时钟表示已到期，未执行扣款或通知。",
            "Next 7 days of events, renewals/expirations within 30 days, and records to review. Dates before the demo clock are overdue; no payment or notification is sent."
          )}
        </Muted>
        {visibleQueue.length > 0 ? (
          <Card>
            <Items>
              {visibleQueue.map((item) => (
                <li key={`${item.module}-${item.id}`}>
                  <ItemHeading>
                    <ActionButton
                      onClick={() => onNavigate(item.module, item.id)}
                      type="button"
                    >
                      {localize(item.title, locale)}
                    </ActionButton>
                    <Muted>{queueLabels[item.kind]}</Muted>
                  </ItemHeading>
                  <Detail>
                    <span>{item.detail}</span>
                    <Muted>
                      {item.at
                        ? `${formatDateTime(item.at, locale, data.timeZone)} (${data.timeZone})`
                        : text("日期待确认", "Date to be confirmed")}
                    </Muted>
                    {item.at && Date.parse(item.at) < Date.parse(data.now) && (
                      <span>
                        <StatusBadge
                          label={text(
                            "日期已过，请核对",
                            "Date passed; review required"
                          )}
                          tone="warning"
                        />
                      </span>
                    )}
                  </Detail>
                </li>
              ))}
            </Items>
          </Card>
        ) : (
          <Stack>
            <EmptyState
              title={text(
                "当前筛选下没有待处理事项",
                "No actions match this filter"
              )}
            />
            {queueFilter !== "all" && (
              <ActionButton onClick={() => setQueueFilter("all")} type="button">
                {text("清除事项筛选", "Clear action filter")}
              </ActionButton>
            )}
          </Stack>
        )}
      </Section>
      <Section aria-label={text("服务与主机状态", "Service and host status")}>
        <SectionHeading>
          <h3>{text("需要留意的状态", "Statuses to review")}</h3>
          <Muted>{issues.length}</Muted>
        </SectionHeading>
        <Toolbar
          aria-label={text("筛选状态", "Filter statuses")}
          className="hyc-segments"
        >
          {(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map(
            (kind) => (
              <ActionButton
                key={kind}
                aria-pressed={statusFilter === kind}
                onClick={() => setStatusFilter(kind)}
                type="button"
              >
                {statusLabels[kind]}
              </ActionButton>
            )
          )}
        </Toolbar>
        <Notice>
          {text(
            "状态来自最后一次样本。过期或来源不可用只说明数据时效，不能据此认定服务宕机。",
            "Status describes the last sample. A stale or unavailable source does not establish that a service is down."
          )}
        </Notice>
        {issues.length > 0 ? (
          <Card>
            <Items>
              {issues.map((item) => {
                const source = data.sources.find(
                  ({ id }) => id === item.sourceId
                );

                return (
                  <li key={`${item.module}-${item.id}`}>
                    <ItemHeading>
                      <ActionButton
                        onClick={() => onNavigate(item.module, item.id)}
                        type="button"
                      >
                        {localize(item.name, locale)}
                      </ActionButton>
                      <Muted>{statusLabels[item.module]}</Muted>
                    </ItemHeading>
                    <Toolbar>
                      <StatusBadge
                        label={`${text("上次状态", "Last status")}: ${healthLabel(item.health, locale)}`}
                        tone={statusTone(item.health)}
                      />
                      <StatusBadge
                        label={freshnessLabel(item.freshness, locale)}
                        tone={sampleTone(item.freshness)}
                      />
                    </Toolbar>
                    <Muted>
                      {text("测量时间", "Observed")}:{" "}
                      {formatDateTime(item.observedAt, locale, data.timeZone)} (
                      {data.timeZone}) · {text("来源", "Source")}:{" "}
                      {source
                        ? localize(source.name, locale)
                        : text("未知", "Unknown")}
                    </Muted>
                  </li>
                );
              })}
            </Items>
          </Card>
        ) : (
          <Stack>
            <EmptyState
              title={text(
                "当前筛选下没有需要留意的状态",
                "No statuses need review in this filter"
              )}
            />
            {statusFilter !== "all" && (
              <ActionButton
                onClick={() => setStatusFilter("all")}
                type="button"
              >
                {text("清除状态筛选", "Clear status filter")}
              </ActionButton>
            )}
          </Stack>
        )}
      </Section>
      <Section aria-label={text("数据来源", "Data sources")}>
        <SectionHeading>
          <h3>{text("数据来源", "Data sources")}</h3>
          <Muted>{data.sources.length}</Muted>
        </SectionHeading>
        <Muted>
          {previewMode === "visitor"
            ? text(
                "访客预览隐藏来源时间细节；此处只演示可见结果。",
                "Visitor preview hides source timestamps; this only demonstrates the visible result."
              )
            : text(
                "展开查看测量、来源更新和抓取时间；较新的抓取时间不会刷新旧样本。",
                "Expand to compare observation, source update and fetch times; a recent fetch does not make an old sample current."
              )}
        </Muted>
        {data.sources.length > 0 ? (
          data.sources.map((source) => (
            <SourceDetails key={source.id}>
              <summary>
                {localize(source.name, locale)} ·{" "}
                {freshnessLabel(source.freshness, locale)}
              </summary>
              <Detail>
                <Muted>{localize(source.note, locale)}</Muted>
                <SourceFacts>
                  <div>
                    <dt>
                      {text("测量时间", "Observed")} ({data.timeZone})
                    </dt>
                    <dd>
                      {formatDateTime(source.observedAt, locale, data.timeZone)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {text("来源更新时间", "Source updated")} ({data.timeZone})
                    </dt>
                    <dd>
                      {formatDateTime(
                        source.sourceUpdatedAt,
                        locale,
                        data.timeZone
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {text("抓取时间", "Fetched")} ({data.timeZone})
                    </dt>
                    <dd>
                      {formatDateTime(source.fetchedAt, locale, data.timeZone)}
                    </dd>
                  </div>
                </SourceFacts>
              </Detail>
            </SourceDetails>
          ))
        ) : (
          <EmptyState
            title={text("没有可见的数据来源", "No visible data sources")}
          />
        )}
      </Section>
    </Section>
  );
};

export default Overview;
