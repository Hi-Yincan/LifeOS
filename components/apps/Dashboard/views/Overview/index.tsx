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
  EmptyState,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
  freshnessLabel,
  healthLabel,
  localize,
  Muted,
  Section,
  SectionHeading,
  StatusBadge,
  summarizeMemberships,
  summarizeServices,
  Toolbar,
} from "components/apps/Dashboard/shared";
import {
  getOverviewQueue,
  type QueueItem,
} from "components/apps/Dashboard/views/Overview/queue";

const OverviewLayout = styled(Section)`
  gap: 18px;
`;
const SummaryStrip = styled.div`
  border-bottom: 1px solid var(--hyc-line);
  border-top: 1px solid var(--hyc-line);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
`;
const SummaryPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
`;
const SummaryButton = styled(ActionButton)`
  && {
    align-items: flex-start;
    background: transparent;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: flex-start;
    min-width: 0;
    overflow-wrap: anywhere;
    padding: 12px 10px;
    text-align: left;
    width: 100%;
  }

  &&:hover {
    background: var(--hyc-hover);
  }

  & + & {
    border-left: 1px solid var(--hyc-line);
  }
`;
const Count = styled.strong`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  font-size: 23px;
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  gap: 5px;

  small {
    color: var(--hyc-muted);
    font-size: 12px;
  }
`;
const SmallText = styled(Muted)`
  font-size: 12px;
  line-height: 1.5;
`;
const Columns = styled.div`
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
`;
const Panel = styled(Section)`
  align-content: start;
  gap: 10px;
`;
const PanelHeading = styled(SectionHeading)`
  border-bottom: 1px solid var(--hyc-line);
  padding-bottom: 7px;
`;
const TextButton = styled(ActionButton)`
  && {
    background: transparent;
    border-color: transparent;
    justify-content: flex-start;
    min-height: 24px;
    overflow-wrap: anywhere;
    padding: 0;
    text-align: left;
  }

  &&:hover {
    color: var(--hyc-accent);
    text-decoration: underline;
  }
`;
const Detail = styled.div`
  display: grid;
  gap: 4px;
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
    min-width: 0;
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
const ActivityItems = styled(Items)`
  > li {
    align-items: start;
    column-gap: 10px;
    grid-template-columns: 42px minmax(0, 1fr);
  }
`;
const RowTime = styled.span`
  color: var(--hyc-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding-top: 4px;
`;
const StatusItems = styled(Items)`
  column-gap: 22px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));

  > li:first-child {
    padding-top: 10px;
  }

  > li:last-child {
    padding-bottom: 10px;
  }
`;
const Disclosure = styled.details`
  color: var(--hyc-muted);
  font-size: 12px;
  line-height: 1.5;
  min-width: 0;
  overflow-wrap: anywhere;

  summary {
    cursor: pointer;
    width: fit-content;
  }

  summary:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }

  &[open] > summary {
    margin-bottom: 8px;
  }
`;
const SourceDetails = styled(Disclosure)`
  border-bottom: 1px solid var(--hyc-line);
  padding: 10px 0;
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
  const renderQueueItem = (item: QueueItem): ReactNode => (
    <li key={`${item.module}-${item.id}`}>
      <ItemHeading>
        <TextButton
          onClick={() => onNavigate(item.module, item.id)}
          type="button"
        >
          {localize(item.title, locale)}
        </TextButton>
        <SmallText>{queueLabels[item.kind]}</SmallText>
      </ItemHeading>
      <SmallText>{item.detail}</SmallText>
      <SmallText>
        {item.at
          ? item.timePrecision === "date"
            ? `${formatDate(item.at, locale, "UTC")} (UTC)`
            : `${formatDateTime(item.at, locale, data.timeZone)} (${data.timeZone})`
          : text("日期待确认", "Date to be confirmed")}
      </SmallText>
      {item.isOverdue && (
        <span>
          <StatusBadge
            label={text("日期已过，请核对", "Date passed; review required")}
            tone="warning"
          />
        </span>
      )}
    </li>
  );

  return (
    <OverviewLayout aria-label={text("看板总览", "Dashboard overview")}>
      <SectionHeading>
        <h2>{text("总览", "Overview")}</h2>
        <SmallText>{formatDate(data.now, locale, data.timeZone)}</SmallText>
      </SectionHeading>
      <Section>
        <SummaryStrip>
          <SummaryPair>
            <SummaryButton
              aria-label={text("查看个人状况", "View personal status")}
              onClick={() => onNavigate("personal")}
              type="button"
            >
              <Muted>{text("个人状况", "Personal status")}</Muted>
              <Count>
                {measuredHealth}
                <small>/ {data.personal.health.length}</small>
              </Count>
              <SmallText>
                {text(
                  "有数值 / 全部健康指标",
                  "With values / all health metrics"
                )}
              </SmallText>
            </SummaryButton>
            <SummaryButton
              aria-label={text("查看会员", "View memberships")}
              onClick={() => onNavigate("memberships")}
              type="button"
            >
              <Muted>{text("会员权益", "Memberships")}</Muted>
              <Count>
                {membershipSummary.activeCount}
                <small>{text("项", "memberships")}</small>
              </Count>
              <SmallText>
                {text("有效或试用权益", "Active or trial access")}
              </SmallText>
            </SummaryButton>
          </SummaryPair>
          <SummaryPair>
            <SummaryButton
              aria-label={text("查看服务", "View services")}
              onClick={() => onNavigate("services")}
              type="button"
            >
              <Muted>{text("自建服务", "Services")}</Muted>
              <Count>
                {serviceSummary.healthy}
                <small>
                  / {serviceSummary.total} {text("正常", "current & up")}
                </small>
              </Count>
              <SmallText>
                {serviceSummary.attention} {text("异常", "degraded/down")} ·{" "}
                {serviceSummary.stale} {text("数据过期", "stale")}
              </SmallText>
            </SummaryButton>
            <SummaryButton
              aria-label={text("查看服务器", "View servers")}
              onClick={() => onNavigate("servers")}
              type="button"
            >
              <Muted>{text("服务器", "Servers")}</Muted>
              <Count>
                {healthyServers}
                <small>
                  / {data.servers.length} {text("正常", "current & up")}
                </small>
              </Count>
              <SmallText>
                {staleServers} {text("数据过期", "stale")} · {unknownServers}{" "}
                {text("未知或无来源", "unknown/source unavailable")}
              </SmallText>
            </SummaryButton>
          </SummaryPair>
        </SummaryStrip>
        <Disclosure>
          <summary>
            {text(
              "摘要口径与会员费用",
              "Summary definitions and membership costs"
            )}
          </summary>
          <Columns>
            <Detail>
              <span>
                {text(
                  "续费计划月均估算",
                  "Monthly equivalent of renewal plans"
                )}
              </span>
              {membershipSummary.estimatedMonthly.length > 0 ? (
                membershipSummary.estimatedMonthly.map((amount) => (
                  <span key={amount.currency}>
                    {formatMoney(amount, locale)}
                  </span>
                ))
              ) : (
                <span>
                  {text(
                    "没有已知费用的续费计划",
                    "No renewal plans with known prices"
                  )}
                </span>
              )}
              <span>
                {text("未知金额", "Unknown amounts")}:{" "}
                {membershipSummary.unknownAmountCount} ·{" "}
                {text("估算不代表实付", "Estimates are not payments")}
              </span>
            </Detail>
            <Detail>
              <span>
                {text(
                  "个人指标统计有数值的记录，各指标单位与测量时间见详情。",
                  "Personal counts include records with values; units and observation times are in their details."
                )}
              </span>
              <span>
                {text(
                  "服务和主机分子仅计入有效样本且正常的记录，分母为全部记录。",
                  "Services and hosts count only current, operational samples over all records."
                )}
              </span>
              <span>
                {text("服务待确认", "Services pending")}:{" "}
                {serviceSummary.pending} · {text("未知", "Unknown")}:{" "}
                {serviceSummary.unknown} · {text("未监测", "Unmonitored")}:{" "}
                {serviceSummary.unmonitored}
              </span>
            </Detail>
          </Columns>
        </Disclosure>
      </Section>
      <Columns>
        <Panel aria-label={text("当前与接下来", "Now and next")}>
          <PanelHeading>
            <h3>{text("当前与接下来", "Now and next")}</h3>
            <TextButton onClick={() => onNavigate("personal")} type="button">
              {text("个人状况", "Personal status")} ›
            </TextButton>
          </PanelHeading>
          <ActivityItems>
            <li>
              <RowTime>
                {currentActivity
                  ? formatTime(currentActivity.startedAt, locale, data.timeZone)
                  : "—"}
              </RowTime>
              <Detail>
                <SmallText>{text("当前活动", "Current activity")}</SmallText>
                {currentActivity ? (
                  <>
                    <TextButton
                      onClick={() => onNavigate("personal", currentActivity.id)}
                      type="button"
                    >
                      {localize(currentActivity.title, locale)}
                    </TextButton>
                    <SmallText>
                      {text("已进行", "Elapsed")}:{" "}
                      {formatDuration(
                        (Date.parse(data.now) -
                          Date.parse(currentActivity.startedAt)) /
                          1000,
                        locale
                      )}
                    </SmallText>
                    {activitySource && (
                      <span>
                        <StatusBadge
                          label={freshnessLabel(
                            activitySource.freshness,
                            locale
                          )}
                          tone={sampleTone(activitySource.freshness)}
                        />
                      </span>
                    )}
                    <Disclosure>
                      <summary>
                        {text("活动时间与来源", "Activity time and source")}
                      </summary>
                      <Detail>
                        <span>
                          {text("开始", "Started")}:{" "}
                          {formatDateTime(
                            currentActivity.startedAt,
                            locale,
                            data.timeZone
                          )}{" "}
                          ({data.timeZone})
                        </span>
                        <span>
                          {text("来源", "Source")}:{" "}
                          {activitySource
                            ? localize(activitySource.name, locale)
                            : text("未知", "Unknown")}
                        </span>
                        <span>
                          {text(
                            "持续时间按固定示例时钟计算。",
                            "Elapsed time uses the fixed demo clock."
                          )}
                        </span>
                      </Detail>
                    </Disclosure>
                  </>
                ) : (
                  <SmallText>
                    {text("暂无进行中的活动", "No current activity")}
                  </SmallText>
                )}
              </Detail>
            </li>
            <li>
              <RowTime>
                {nextEvent
                  ? formatTime(nextEvent.startsAt, locale, data.timeZone)
                  : "—"}
              </RowTime>
              <Detail>
                <SmallText>
                  {text("下一项日程", "Next scheduled event")}
                </SmallText>
                {nextEvent ? (
                  <>
                    <TextButton
                      onClick={() => onNavigate("personal", nextEvent.id)}
                      type="button"
                    >
                      {localize(nextEvent.title, locale)}
                    </TextButton>
                    <SmallText>
                      {formatDateTime(
                        nextEvent.startsAt,
                        locale,
                        data.timeZone
                      )}{" "}
                      –{" "}
                      {formatDateTime(nextEvent.endsAt, locale, data.timeZone)}{" "}
                      ({data.timeZone})
                    </SmallText>
                    <Disclosure>
                      <summary>{text("日程详情", "Schedule details")}</summary>
                      <Detail>
                        <span>
                          {formatDateTime(
                            nextEvent.startsAt,
                            locale,
                            data.timeZone
                          )}{" "}
                          –{" "}
                          {formatDateTime(
                            nextEvent.endsAt,
                            locale,
                            data.timeZone
                          )}{" "}
                          ({data.timeZone})
                        </span>
                        {nextEvent.location && (
                          <span>{localize(nextEvent.location, locale)}</span>
                        )}
                        <span>
                          {text(
                            "计划安排，未自动确认完成",
                            "A plan; completion is not confirmed automatically"
                          )}
                        </span>
                      </Detail>
                    </Disclosure>
                  </>
                ) : (
                  <SmallText>
                    {text("暂无后续日程", "No upcoming events")}
                  </SmallText>
                )}
              </Detail>
            </li>
          </ActivityItems>
        </Panel>
        <Panel aria-label={text("待处理事项", "Upcoming actions")}>
          <PanelHeading>
            <h3>{text("待处理事项", "Upcoming actions")}</h3>
            <SmallText>
              {text("匹配", "Matching")} {visibleQueue.length} / {queue.length}
            </SmallText>
          </PanelHeading>
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
          {visibleQueue.length > 0 ? (
            <>
              <Items>{visibleQueue.slice(0, 4).map(renderQueueItem)}</Items>
              {visibleQueue.length > 4 && (
                <Disclosure key={queueFilter}>
                  <summary>
                    {text(
                      `其余 ${visibleQueue.length - 4} 项`,
                      `${visibleQueue.length - 4} more actions`
                    )}
                  </summary>
                  <Items>{visibleQueue.slice(4).map(renderQueueItem)}</Items>
                </Disclosure>
              )}
            </>
          ) : (
            <EmptyState
              description={
                queueFilter === "all"
                  ? undefined
                  : text(
                      "请调整上方的事项筛选条件。",
                      "Adjust the action filters above."
                    )
              }
              title={text(
                "当前筛选下没有待处理事项",
                "No actions match this filter"
              )}
            />
          )}
          <Disclosure>
            <summary>
              {text("事项范围与日期口径", "Action range and date rules")}
            </summary>
            <p>
              {text(
                "日程按未来 7 天的时刻筛选；续费/到期按含今日的 30 个 UTC 日历日筛选，另保留已过日期与待核对记录。未执行扣款或通知。",
                "Events use the next 7 days from the demo time. Renewals/expirations use 30 UTC calendar days including today; past dates and records to review remain listed. No payment or notification is sent."
              )}
            </p>
          </Disclosure>
        </Panel>
      </Columns>
      <Panel aria-label={text("服务与主机状态", "Service and host status")}>
        <PanelHeading>
          <h3>{text("需要留意的状态", "Statuses to review")}</h3>
          <SmallText>{issues.length}</SmallText>
        </PanelHeading>
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
        {issues.length > 0 ? (
          <StatusItems>
            {issues.map((item) => {
              const source = data.sources.find(
                ({ id }) => id === item.sourceId
              );

              return (
                <li key={`${item.module}-${item.id}`}>
                  <ItemHeading>
                    <TextButton
                      onClick={() => onNavigate(item.module, item.id)}
                      type="button"
                    >
                      {localize(item.name, locale)}
                    </TextButton>
                    <SmallText>{statusLabels[item.module]}</SmallText>
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
                  <Disclosure>
                    <summary>
                      {text("测量时间", "Observed")}:{" "}
                      {formatDateTime(item.observedAt, locale, data.timeZone)} (
                      {data.timeZone})
                    </summary>
                    <span>
                      {text("来源", "Source")}:{" "}
                      {source
                        ? localize(source.name, locale)
                        : text("未知", "Unknown")}
                    </span>
                  </Disclosure>
                </li>
              );
            })}
          </StatusItems>
        ) : (
          <EmptyState
            description={
              statusFilter === "all"
                ? undefined
                : text(
                    "请调整上方的状态筛选条件。",
                    "Adjust the status filters above."
                  )
            }
            title={text(
              "当前筛选下没有需要留意的状态",
              "No statuses need review in this filter"
            )}
          />
        )}
        <Disclosure>
          <summary>
            {text("状态与数据时效", "Status and sample freshness")}
          </summary>
          <p>
            {text(
              "状态来自最后一次样本。过期或来源不可用只说明数据时效，不能据此认定服务宕机。",
              "Status describes the last sample. A stale or unavailable source does not establish that a service is down."
            )}
          </p>
        </Disclosure>
      </Panel>
      <Panel aria-label={text("数据来源", "Data sources")}>
        <PanelHeading>
          <h3>{text("数据来源", "Data sources")}</h3>
          <SmallText>{data.sources.length}</SmallText>
        </PanelHeading>
        <Disclosure>
          <summary>
            {text("查看来源状态与时间", "View source statuses and timestamps")}
          </summary>
          <SmallText>
            {text(
              "测量、来源更新和抓取时间分别记录；较新的抓取时间不会刷新旧样本。",
              "Observation, source update and fetch times are separate; a recent fetch does not make an old sample current."
            )}
          </SmallText>
          {data.sources.length > 0 ? (
            data.sources.map((source) => (
              <SourceDetails key={source.id}>
                <summary>
                  {localize(source.name, locale)} ·{" "}
                  {freshnessLabel(source.freshness, locale)}
                </summary>
                <Detail>
                  <span>{localize(source.note, locale)}</span>
                  <SourceFacts>
                    <div>
                      <dt>
                        {text("测量时间", "Observed")} ({data.timeZone})
                      </dt>
                      <dd>
                        {formatDateTime(
                          source.observedAt,
                          locale,
                          data.timeZone
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        {text("来源更新时间", "Source updated")} (
                        {data.timeZone})
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
                        {formatDateTime(
                          source.fetchedAt,
                          locale,
                          data.timeZone
                        )}
                      </dd>
                    </div>
                  </SourceFacts>
                </Detail>
              </SourceDetails>
            ))
          ) : (
            <EmptyState title={text("暂无数据来源", "No data sources")} />
          )}
        </Disclosure>
      </Panel>
    </OverviewLayout>
  );
};

export default Overview;
