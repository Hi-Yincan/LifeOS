/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- 资源表格的横向滚动区域需要键盘焦点。 */
import { type ReactNode, useState } from "react";
import styled from "styled-components";
import {
  type DashboardLocale,
  type DashboardViewProps,
  type Freshness,
  type HealthStatus,
  type Server,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  type BadgeTone,
  Card,
  CardGrid,
  EmptyState,
  Field,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatNumber,
  freshnessLabel,
  healthLabel,
  localize,
  Metric,
  MetricGrid,
  MiniChart,
  Muted,
  Notice,
  percentage,
  Section,
  SectionHeading,
  Stack,
  StatusBadge,
  Toolbar,
} from "components/apps/Dashboard/shared";

type MetricKey = keyof Server["history"];
type HostFilter = "all" | HealthStatus;
type SourceFilter = "all" | Freshness;

const Facts = styled.dl`
  display: grid;
  font-size: 12px;
  gap: 7px 12px;
  grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr);
  margin: 0;

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  dt {
    color: var(--hyc-muted);
  }
`;

const Filters = styled(Toolbar)`
  align-items: end;

  label {
    flex: 1 1 150px;
    max-width: 260px;
  }

  input,
  select {
    max-width: 100%;
    width: 100%;
  }
`;

const SeriesControls = styled(Toolbar)`
  align-items: end;

  label {
    flex: 1 1 140px;
    max-width: 220px;
  }

  select {
    width: 100%;
  }
`;

const HostSummary = styled.dl`
  border-bottom: 1px solid var(--hyc-line);
  border-top: 1px solid var(--hyc-line);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 130px), 1fr));
  margin: 0;

  > div {
    min-width: 0;
    padding: 10px 8px;
  }

  dt {
    color: var(--hyc-muted);
    font-size: 12px;
  }

  dd {
    font-size: 22px;
    font-variant-numeric: tabular-nums;
    margin: 3px 0 0;
  }
`;

const ResourceList = styled.div`
  container-type: inline-size;
  min-width: 0;

  .server-table-scroll {
    overflow-x: auto;
  }

  .server-table-scroll:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }

  table {
    border-collapse: collapse;
    font-size: 12px;
    min-width: 650px;
    text-align: left;
    width: 100%;
  }

  thead {
    background: var(--hyc-panel);
    color: var(--hyc-muted);
  }

  td,
  th {
    border-bottom: 1px solid var(--hyc-line);
    font-weight: 400;
    padding: 11px 8px;
    vertical-align: middle;
  }

  tbody th {
    width: 24%;
  }

  tbody tr:hover {
    background: var(--hyc-hover);
  }

  .server-cell-label {
    display: none;
  }

  .server-identity,
  .server-network,
  .server-status {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .server-identity > span,
  .server-status > span {
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  .server-network {
    font-variant-numeric: tabular-nums;
  }

  .server-status > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  @container (max-width: 650px) {
    table {
      min-width: 0;
    }

    thead {
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      width: 1px;
    }

    tbody {
      display: block;
    }

    tbody tr {
      border-bottom: 1px solid var(--hyc-line);
      display: grid;
      gap: 10px 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 12px 4px;
    }

    td,
    tbody th {
      border: 0;
      min-width: 0;
      padding: 0;
      width: auto;
    }

    tbody th,
    td:nth-child(4),
    td:last-child {
      grid-column: 1 / -1;
    }

    .server-cell-label {
      color: var(--hyc-muted);
      display: block;
      margin-bottom: 5px;
    }

    .server-network,
    .server-status > div {
      display: flex;
      flex-flow: row wrap;
      gap: 5px 12px;
    }
  }
`;

const HostLink = styled(ActionButton)`
  background: transparent;
  border: 0;
  color: var(--hyc-text);
  font-size: 13px;
  justify-self: start;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 0;
  text-align: left;
  white-space: normal;

  &:hover {
    background: transparent;
    color: var(--hyc-accent);
    text-decoration: underline;
  }
`;

const UsageValue = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
  gap: 5px 8px;

  .server-meter {
    background: var(--hyc-line);
    flex: 0 0 42px;
    height: 3px;
  }

  .server-meter > span {
    background: var(--hyc-accent);
    display: block;
    height: 100%;
  }
`;

const percent = (value: null | number, locale: DashboardLocale): string =>
  value === null || !Number.isFinite(value)
    ? "—"
    : `${formatNumber(value, locale)}%`;

const ResourceUsage = ({
  active,
  locale,
  value,
}: {
  active: boolean;
  locale: DashboardLocale;
  value: null | number;
}): ReactNode =>
  active &&
  value !== null &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100 ? (
    <UsageValue>
      <span aria-hidden="true" className="server-meter">
        <span style={{ width: `${value}%` }} />
      </span>
      <span>{percent(value, locale)}</span>
    </UsageValue>
  ) : (
    <Muted>—</Muted>
  );

const rate = (value: null | number, locale: DashboardLocale): string =>
  value === null || !Number.isFinite(value)
    ? "—"
    : `${formatNumber(value, locale, { maximumFractionDigits: 0 })} bytes/s`;

const hostTone = (status: HealthStatus): BadgeTone => {
  if (status === "down") return "danger";
  if (status === "up") return "success";
  if (status === "degraded" || status === "maintenance") return "warning";
  return "neutral";
};

const hostLabel = (server: Server, locale: DashboardLocale): string => {
  const current =
    server.health === "down"
      ? locale === "zh"
        ? "主机离线"
        : "Host offline"
      : healthLabel(server.health, locale);

  return server.freshness === "stale"
    ? locale === "zh"
      ? `上次状态：${current}`
      : `Last known: ${current}`
    : current;
};

const ServerState = ({
  locale,
  server,
}: {
  locale: DashboardLocale;
  server: Server;
}): ReactNode => (
  <Toolbar>
    <StatusBadge
      label={hostLabel(server, locale)}
      tone={server.freshness === "fresh" ? hostTone(server.health) : "neutral"}
    />
    <StatusBadge
      label={freshnessLabel(server.freshness, locale)}
      tone={
        server.freshness === "unavailable"
          ? "danger"
          : server.freshness === "stale"
            ? "warning"
            : "neutral"
      }
    />
  </Toolbar>
);

const samplingWindow = (server: Server, locale: DashboardLocale): string =>
  server.sampleWindowSeconds === null
    ? locale === "zh"
      ? "采样窗口未知"
      : "Sample window unknown"
    : locale === "zh"
      ? `${formatNumber(server.sampleWindowSeconds, locale)} 秒采样窗口`
      : `${formatNumber(server.sampleWindowSeconds, locale)}-second sample window`;

const cpuBasis = (server: Server, locale: DashboardLocale): string => {
  const cores =
    server.cpuLogicalCores === null
      ? locale === "zh"
        ? "逻辑核数未知"
        : "Logical core count unknown"
      : locale === "zh"
        ? `${server.cpuLogicalCores} 个逻辑 CPU`
        : `${server.cpuLogicalCores} logical CPUs`;

  return locale === "zh"
    ? `整机总容量为 100% · ${cores}`
    : `100% = total host capacity · ${cores}`;
};

const ServerDetail = ({
  data,
  locale,
  onNavigate,
  server,
}: Pick<DashboardViewProps, "data" | "locale" | "onNavigate"> & {
  server: Server;
}): ReactNode => {
  const [metric, setMetric] = useState<MetricKey>("cpu");
  const [hours, setHours] = useState(24);
  const isZh = locale === "zh";
  const source = data.sources.find(({ id }) => id === server.sourceId);
  const services = data.services.filter(
    ({ serverId }) => serverId === server.id
  );
  const labels: Record<MetricKey, string> = {
    cpu: isZh ? "CPU 使用率" : "CPU usage",
    memory: isZh ? "内存使用率" : "Memory usage",
    network: isZh ? "网络入站速率" : "Inbound network rate",
  };
  const until = Date.parse(data.now);
  const since = until - hours * 3_600_000;
  const points = server.history[metric].filter(({ at }) => {
    const time = Date.parse(at);

    return Number.isFinite(time) && time >= since && time <= until;
  });
  const missing = points.filter(
    ({ value }) => value === null || !Number.isFinite(value)
  ).length;
  const noDataMessage =
    source === undefined
      ? isZh
        ? "尚未配置演示来源。"
        : "No demonstration source is configured."
      : server.freshness === "unavailable"
        ? isZh
          ? "来源不可用，无法判断主机当前状态。"
          : "The source is unavailable; the host's current state is unknown."
        : server.health === "down"
          ? isZh
            ? "来源报告主机离线，没有资源采样。"
            : "The source reports this host offline; no resource samples are available."
          : isZh
            ? "所选范围没有采样记录。"
            : "There are no samples in the selected range.";
  const usedCapacity = (used: null | number, total: null | number): string =>
    `${formatBytes(used, locale)} / ${formatBytes(total, locale)}`;

  return (
    <Section aria-label={localize(server.name, locale)}>
      <SectionHeading>
        <h2>{localize(server.name, locale)}</h2>
        <ActionButton onClick={() => onNavigate("servers")} type="button">
          {isZh ? "返回主机列表" : "Back to hosts"}
        </ActionButton>
      </SectionHeading>
      <ServerState locale={locale} server={server} />
      <Notice>{localize(server.note, locale)}</Notice>
      <MetricGrid>
        <Metric
          detail={cpuBasis(server, locale)}
          label={labels.cpu}
          value={percent(server.metrics.cpuPercent, locale)}
        />
        <Metric
          detail={usedCapacity(
            server.metrics.memoryUsedBytes,
            server.metrics.memoryTotalBytes
          )}
          label={labels.memory}
          value={percent(
            percentage(
              server.metrics.memoryUsedBytes,
              server.metrics.memoryTotalBytes
            ),
            locale
          )}
        />
        <Metric
          detail={usedCapacity(
            server.metrics.diskUsedBytes,
            server.metrics.diskTotalBytes
          )}
          label={isZh ? "磁盘已用容量" : "Disk space used"}
          value={percent(
            percentage(
              server.metrics.diskUsedBytes,
              server.metrics.diskTotalBytes
            ),
            locale
          )}
        />
        <Metric
          detail={
            isZh
              ? `出站 ${rate(server.metrics.networkOutBytesPerSecond, locale)}`
              : `Outbound ${rate(server.metrics.networkOutBytesPerSecond, locale)}`
          }
          label={labels.network}
          unit="bytes/s"
          value={formatNumber(server.metrics.networkInBytesPerSecond, locale, {
            maximumFractionDigits: 0,
          })}
        />
      </MetricGrid>
      <Muted>
        {samplingWindow(server, locale)}
        {isZh
          ? "；容量按 1024 进位；网络单位为字节每秒。— 表示缺失，不是 0。"
          : "; capacity uses powers of 1024; network uses bytes per second. — means missing, not zero."}
      </Muted>
      <Card>
        <Stack>
          <h3>{isZh ? "资源趋势" : "Resource history"}</h3>
          <SeriesControls>
            <Field>
              <span>{isZh ? "趋势指标" : "Trend metric"}</span>
              <select
                onChange={(event) => setMetric(event.target.value as MetricKey)}
                value={metric}
              >
                <option value="cpu">{labels.cpu}</option>
                <option value="memory">{labels.memory}</option>
                <option value="network">{labels.network}</option>
              </select>
            </Field>
            <Field>
              <span>{isZh ? "时间范围" : "Time range"}</span>
              <select
                onChange={(event) => setHours(Number(event.target.value))}
                value={hours}
              >
                {[6, 12, 24].map((value) => (
                  <option key={value} value={value}>
                    {isZh ? `近 ${value} 小时` : `Last ${value} hours`}
                  </option>
                ))}
              </select>
            </Field>
          </SeriesControls>
          <Muted>
            {formatDateTime(
              new Date(since).toISOString(),
              locale,
              data.timeZone
            )}
            {" – "}
            {formatDateTime(data.now, locale, data.timeZone)} ({data.timeZone})
          </Muted>
          {points.length === 0 ? (
            <EmptyState
              description={noDataMessage}
              title={isZh ? "暂无历史数据" : "No history available"}
            />
          ) : (
            <MiniChart
              label={labels[metric]}
              locale={locale}
              points={points}
              timeZone={data.timeZone}
              unit={metric === "network" ? "bytes/s" : "%"}
            />
          )}
          <Muted aria-live="polite">
            {isZh
              ? `${points.length - missing} 个有效样本 · ${missing} 个缺测点。图中按小时选择合成样本，缺口不补零。`
              : `${points.length - missing} valid samples · ${missing} missing samples. Synthetic points are selected hourly; gaps are not filled with zero.`}
          </Muted>
          <Muted>
            {isZh
              ? "磁盘只提供当前容量示例；未提供历史，不绘制推算曲线。"
              : "Disk capacity is a current sample only; no historical values are supplied."}
          </Muted>
        </Stack>
      </Card>
      <CardGrid>
        <Card>
          <Stack>
            <h3>{isZh ? "主机资料" : "Host details"}</h3>
            <Facts>
              <dt>{isZh ? "区域" : "Region"}</dt>
              <dd>{localize(server.region, locale)}</dd>
              <dt>{isZh ? "供应商" : "Provider"}</dt>
              <dd>{localize(server.provider, locale)}</dd>
              <dt>{isZh ? "操作系统" : "Operating system"}</dt>
              <dd>{server.os}</dd>
              <dt>CPU</dt>
              <dd>{server.cpuLabel}</dd>
              <dt>{isZh ? "连续运行时间" : "Uptime"}</dt>
              <dd>{formatDuration(server.metrics.uptimeSeconds, locale)}</dd>
              <dt>{isZh ? "标签" : "Tags"}</dt>
              <dd>{server.tags.join(" · ") || "—"}</dd>
            </Facts>
          </Stack>
        </Card>
        <Card>
          <Stack>
            <h3>{isZh ? "采样信息" : "Sample information"}</h3>
            <Facts>
              <dt>{isZh ? "来源" : "Source"}</dt>
              <dd>
                {source
                  ? localize(source.name, locale)
                  : isZh
                    ? "未配置"
                    : "Not configured"}
              </dd>
              <dt>{isZh ? "来源状态" : "Source status"}</dt>
              <dd>{source ? freshnessLabel(source.freshness, locale) : "—"}</dd>
              <dt>{isZh ? "主机最后报告" : "Host last reported"}</dt>
              <dd>
                {formatDateTime(server.lastSeenAt, locale, data.timeZone)}
              </dd>
              <dt>{isZh ? "来源观测时间" : "Source observed"}</dt>
              <dd>
                {source
                  ? formatDateTime(source.observedAt, locale, data.timeZone)
                  : "—"}
              </dd>
              <dt>{isZh ? "来源更新时间" : "Source updated"}</dt>
              <dd>
                {source
                  ? formatDateTime(
                      source.sourceUpdatedAt,
                      locale,
                      data.timeZone
                    )
                  : "—"}
              </dd>
              <dt>{isZh ? "获取时间" : "Fetched at"}</dt>
              <dd>
                {source
                  ? formatDateTime(source.fetchedAt, locale, data.timeZone)
                  : "—"}
              </dd>
              <dt>{isZh ? "采样窗口" : "Sample window"}</dt>
              <dd>{samplingWindow(server, locale)}</dd>
              <dt>{isZh ? "时区" : "Time zone"}</dt>
              <dd>{data.timeZone}</dd>
            </Facts>
            {source && <Muted>{localize(source.note, locale)}</Muted>}
          </Stack>
        </Card>
      </CardGrid>
      <Card>
        <Stack>
          <h3>{isZh ? "关联服务" : "Linked services"}</h3>
          <Muted>
            {isZh
              ? "主机资源与服务可用性分别观察；来源失联不代表关联服务全部故障。"
              : "Host resources and service availability are separate observations; source failure does not mean every linked service is down."}
          </Muted>
          {services.length === 0 ? (
            <Muted>
              {isZh
                ? "当前视图没有关联服务。"
                : "No linked services in this view."}
            </Muted>
          ) : (
            <Toolbar>
              {services.map((service) => (
                <ActionButton
                  key={service.id}
                  onClick={() => onNavigate("services", service.id)}
                  type="button"
                >
                  {localize(service.name, locale)}
                </ActionButton>
              ))}
            </Toolbar>
          )}
        </Stack>
      </Card>
    </Section>
  );
};

const Servers = ({
  data,
  locale,
  onNavigate,
  selectedId,
}: DashboardViewProps): ReactNode => {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HostFilter>("all");
  const [freshness, setFreshness] = useState<SourceFilter>("all");
  const isZh = locale === "zh";
  const selected = data.servers.find(({ id }) => id === selectedId);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const summary = {
    offline: data.servers.filter(
      (server) => server.freshness === "fresh" && server.health === "down"
    ).length,
    online: data.servers.filter(
      (server) => server.freshness === "fresh" && server.health === "up"
    ).length,
    stale: data.servers.filter((server) => server.freshness === "stale").length,
    unavailable: data.servers.filter(
      (server) => server.freshness === "unavailable"
    ).length,
  };
  const hosts = data.servers.filter((server) => {
    const searchable = [
      server.name.zh,
      server.name.en,
      localize(server.region, locale),
      localize(server.provider, locale),
      server.os,
      server.cpuLabel,
      ...server.tags,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return (
      (health === "all" || server.health === health) &&
      (freshness === "all" || server.freshness === freshness) &&
      searchable.includes(normalizedQuery)
    );
  });

  if (selectedId) {
    return selected ? (
      <ServerDetail
        key={selected.id}
        data={data}
        locale={locale}
        onNavigate={onNavigate}
        server={selected}
      />
    ) : (
      <Section>
        <EmptyState
          description={
            isZh
              ? "该主机不在当前视图中。"
              : "This host is not available in the current view."
          }
          title={isZh ? "未找到主机" : "Host not found"}
        />
        <ActionButton onClick={() => onNavigate("servers")} type="button">
          {isZh ? "返回主机列表" : "Back to hosts"}
        </ActionButton>
      </Section>
    );
  }

  return (
    <Section aria-label={isZh ? "服务器" : "Servers"}>
      <SectionHeading>
        <h2>{isZh ? "服务器" : "Servers"}</h2>
        <Muted aria-live="polite">
          {isZh
            ? `${hosts.length} / ${data.servers.length} 台主机`
            : `${hosts.length} / ${data.servers.length} hosts`}
        </Muted>
      </SectionHeading>
      <HostSummary aria-label={isZh ? "全部主机摘要" : "All hosts summary"}>
        <div>
          <dt>{isZh ? "有效在线" : "Current online"}</dt>
          <dd>
            {summary.online} / {data.servers.length}
          </dd>
        </div>
        <div>
          <dt>{isZh ? "明确离线" : "Reported offline"}</dt>
          <dd>{summary.offline}</dd>
        </div>
        <div>
          <dt>{isZh ? "样本过期" : "Stale samples"}</dt>
          <dd>{summary.stale}</dd>
        </div>
        <div>
          <dt>{isZh ? "来源不可用" : "Source unavailable"}</dt>
          <dd>{summary.unavailable}</dd>
        </div>
      </HostSummary>
      <Filters>
        <Field>
          <span>{isZh ? "搜索主机" : "Search hosts"}</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isZh ? "名称、区域或标签" : "Name, region or tag"}
            type="search"
            value={query}
          />
        </Field>
        <Field>
          <span>{isZh ? "主机状态" : "Host status"}</span>
          <select
            onChange={(event) => setHealth(event.target.value as HostFilter)}
            value={health}
          >
            <option value="all">
              {isZh ? "全部主机状态" : "All host states"}
            </option>
            <option value="up">
              {isZh
                ? "正常（含上次状态）"
                : "Operational (including last known)"}
            </option>
            <option value="down">{isZh ? "主机离线" : "Host offline"}</option>
            <option value="degraded">{healthLabel("degraded", locale)}</option>
            <option value="maintenance">
              {healthLabel("maintenance", locale)}
            </option>
            <option value="pending">{healthLabel("pending", locale)}</option>
            <option value="unknown">{healthLabel("unknown", locale)}</option>
          </select>
        </Field>
        <Field>
          <span>{isZh ? "数据状态" : "Data status"}</span>
          <select
            onChange={(event) =>
              setFreshness(event.target.value as SourceFilter)
            }
            value={freshness}
          >
            <option value="all">
              {isZh ? "全部数据状态" : "All data states"}
            </option>
            <option value="fresh">{freshnessLabel("fresh", locale)}</option>
            <option value="stale">{freshnessLabel("stale", locale)}</option>
            <option value="unavailable">
              {freshnessLabel("unavailable", locale)}
            </option>
            <option value="unknown">{freshnessLabel("unknown", locale)}</option>
          </select>
        </Field>
      </Filters>
      {hosts.length === 0 ? (
        <EmptyState
          description={
            data.servers.length === 0
              ? isZh
                ? "当前视图没有可展示的主机示例。"
                : "There are no host examples in the current view."
              : isZh
                ? "请调整搜索内容或筛选条件。"
                : "Try adjusting the search or filters."
          }
          title={isZh ? "没有匹配的主机" : "No matching hosts"}
        />
      ) : (
        <ResourceList>
          <div
            aria-label={
              isZh
                ? "主机资源比较，可横向滚动"
                : "Host resource comparison, horizontally scrollable"
            }
            className="server-table-scroll"
            role="region"
            tabIndex={0}
          >
            <table
              aria-label={isZh ? "主机资源与状态" : "Host resources and status"}
            >
              <thead>
                <tr>
                  <th scope="col">{isZh ? "主机" : "Host"}</th>
                  <th scope="col">CPU</th>
                  <th scope="col">{isZh ? "内存" : "Memory"}</th>
                  <th scope="col">{isZh ? "网络" : "Network"}</th>
                  <th scope="col">{isZh ? "状态" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((server) => {
                  const active =
                    server.freshness === "fresh" &&
                    ["degraded", "maintenance", "up"].includes(server.health);

                  return (
                    <tr key={server.id}>
                      <th scope="row">
                        <div className="server-identity">
                          <HostLink
                            aria-label={
                              isZh
                                ? `查看${localize(server.name, locale)}详情`
                                : `View ${localize(server.name, locale)} details`
                            }
                            onClick={() => onNavigate("servers", server.id)}
                            type="button"
                          >
                            {localize(server.name, locale)}
                          </HostLink>
                          <Muted>
                            {localize(server.region, locale)} ·{" "}
                            {server.cpuLabel}
                          </Muted>
                        </div>
                      </th>
                      <td>
                        <span aria-hidden="true" className="server-cell-label">
                          CPU
                        </span>
                        <ResourceUsage
                          active={active}
                          locale={locale}
                          value={server.metrics.cpuPercent}
                        />
                      </td>
                      <td>
                        <span aria-hidden="true" className="server-cell-label">
                          {isZh ? "内存" : "Memory"}
                        </span>
                        <ResourceUsage
                          active={active}
                          locale={locale}
                          value={percentage(
                            server.metrics.memoryUsedBytes,
                            server.metrics.memoryTotalBytes
                          )}
                        />
                      </td>
                      <td>
                        <span aria-hidden="true" className="server-cell-label">
                          {isZh ? "网络" : "Network"}
                        </span>
                        <div className="server-network">
                          <span>
                            {isZh ? "接收" : "In"}{" "}
                            {active
                              ? rate(
                                  server.metrics.networkInBytesPerSecond,
                                  locale
                                )
                              : "—"}
                          </span>
                          <Muted>
                            {isZh ? "发送" : "Out"}{" "}
                            {active
                              ? rate(
                                  server.metrics.networkOutBytesPerSecond,
                                  locale
                                )
                              : "—"}
                          </Muted>
                        </div>
                      </td>
                      <td>
                        <span aria-hidden="true" className="server-cell-label">
                          {isZh ? "状态" : "Status"}
                        </span>
                        <div className="server-status">
                          <ServerState locale={locale} server={server} />
                          <Muted>
                            {isZh ? "最后报告" : "Last report"}{" "}
                            {formatDateTime(
                              server.lastSeenAt,
                              locale,
                              data.timeZone
                            )}{" "}
                            ({data.timeZone})
                          </Muted>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ResourceList>
      )}
      <Muted>
        {isZh
          ? "列表只比较有效资源样本；CPU 的 100% 表示整机总容量，网络单位为 bytes/s。— 表示当前无有效样本。点击主机查看过期值、磁盘容量与历史。"
          : "The list compares current resource samples only. CPU 100% is total host capacity; network rates use bytes/s. — means no current sample. Open a host for older values, disk capacity and history."}
      </Muted>
    </Section>
  );
};

export default Servers;
