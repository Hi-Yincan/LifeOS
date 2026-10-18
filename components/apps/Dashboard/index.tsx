/* eslint-disable no-alert -- 沿用原生确认保护未保存示例，重置也需要明确确认。 */
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import messages from "components/apps/Dashboard/messages";
import {
  type DashboardDemoData,
  type DashboardModule,
  type DashboardViewProps,
} from "components/apps/Dashboard/model";
import {
  ActionButton,
  EmptyState,
  formatDateTime,
  Notice,
  selectVisibleDemoData,
  StatusBadge,
} from "components/apps/Dashboard/shared";
import Memberships from "components/apps/Dashboard/views/Memberships";
import Overview from "components/apps/Dashboard/views/Overview";
import Personal from "components/apps/Dashboard/views/Personal";
import {
  getPersonalTab,
  tabs as personalTabs,
} from "components/apps/Dashboard/views/Personal/common";
import Servers from "components/apps/Dashboard/views/Servers";
import Services from "components/apps/Dashboard/views/Services";
import { Back } from "components/apps/FileExplorer/NavigationIcons";
import StyledAddressBar from "components/apps/FileExplorer/StyledAddressBar";
import StyledNavigation from "components/apps/FileExplorer/StyledNavigation";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledStatusBar from "components/system/Files/FileManager/StyledStatusBar";
import { registerCloseGuard } from "components/system/LifeOS/closeGuards";
import { useLifeOS } from "components/system/LifeOS/context";
import Icon from "components/system/LifeOS/Icon";
import Surface from "components/system/LifeOS/Surface";
import { useProcessesActions } from "contexts/process";
import Button from "styles/common/Button";
import ScrollBars from "styles/common/ScrollBars";

const moduleOrder: DashboardModule[] = [
  "overview",
  "personal",
  "memberships",
  "services",
  "servers",
];
const views = {
  memberships: Memberships,
  overview: Overview,
  personal: Personal,
  servers: Servers,
  services: Services,
};
const icons = {
  memberships: "book",
  overview: "grid",
  personal: "user",
  servers: "code",
  services: "link",
};
type Route = {
  invalidModule: boolean;
  module: DashboardModule;
  selectedId?: string;
};
const initialRoute: Route = { invalidModule: false, module: "overview" };
const readRoute = (): Route => {
  const query = new URLSearchParams(location.search);
  const requested = query.get("dashboard") || "overview";
  const selectedModule = moduleOrder.find((item) => item === requested);

  return selectedModule
    ? {
        invalidModule: false,
        module: selectedModule,
        selectedId: query.get("dashboardItem") || undefined,
      }
    : { invalidModule: true, module: "overview" };
};
const historyIndex = (value: unknown, session: string): number | undefined => {
  if (
    !value ||
    typeof value !== "object" ||
    !("lifeosDashboardIndex" in value) ||
    !("lifeosDashboardSession" in value) ||
    value.lifeosDashboardSession !== session
  ) {
    return undefined;
  }
  return typeof value.lifeosDashboardIndex === "number" &&
    Number.isSafeInteger(value.lifeosDashboardIndex)
    ? value.lifeosDashboardIndex
    : undefined;
};
const historyState = (
  index: number,
  session: string
): Record<string, unknown> => ({
  ...(history.state && typeof history.state === "object"
    ? (history.state as Record<string, unknown>)
    : {}),
  lifeosDashboardIndex: index,
  lifeosDashboardSession: session,
});
const hasSelectedRecord = (data: DashboardDemoData, route: Route): boolean => {
  if (!route.selectedId) return true;
  if (route.module === "personal") {
    return (
      ["activity", "checkups", "health", "location"].includes(
        route.selectedId
      ) ||
      [
        ...data.personal.activities,
        ...data.personal.schedule,
        ...data.personal.health,
        ...data.personal.checkups,
        ...data.personal.route,
      ].some(({ id }) => id === route.selectedId)
    );
  }
  return (
    route.module !== "overview" &&
    data[route.module].some(({ id }) => id === route.selectedId)
  );
};
const StyledDashboard = styled(Surface)`
  container-name: dashboard;
  container-type: inline-size;
  display: grid;
  grid-template-rows: 35px minmax(0, 1fr) auto;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  position: relative;
  width: 100%;

  .dashboard-address {
    align-items: center;
    flex: 1;
    gap: 7px;
    min-width: 0;
    padding: 0 6px;
  }

  .dashboard-address > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-top-actions {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    gap: 5px;
    padding-right: 7px;
  }

  .dashboard-top-actions select {
    font-size: 11px;
    padding: 3px 4px;
    width: 108px;
  }

  .dashboard-top-actions button {
    font-size: 11px;
    min-height: 24px;
    padding: 2px 7px;
  }

  .dashboard-workspace {
    display: grid;
    grid-template-columns: clamp(68px, 16%, 148px) minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    min-width: 0;
  }

  .dashboard-sidebar {
    background: var(--hyc-panel);
    border-right: 1px solid var(--hyc-line);
    min-height: 0;
    min-width: 0;
    overflow: auto;
    padding: 8px 4px;
    ${ScrollBars()}
  }

  .dashboard-modules {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .dashboard-modules button {
    background: transparent;
    border-color: transparent;
    flex-direction: column;
    font-size: 11px;
    gap: 3px;
    justify-content: center;
    min-height: 42px;
    padding: 6px 2px;
    text-align: center;
    width: 100%;
  }

  .dashboard-modules button span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .dashboard-nav-full {
    display: none;
  }

  .dashboard-modules button[aria-current="page"] {
    background: var(--hyc-selected);
    border-color: var(--hyc-selected-border);
  }

  .dashboard-submodules {
    border-bottom: 1px solid var(--hyc-line);
    display: grid;
    gap: 1px;
    padding-bottom: 6px;
  }

  .dashboard-submodules button {
    color: var(--hyc-muted);
    font-size: 11px;
    min-height: 30px;
    padding: 5px 2px;
  }

  .dashboard-submodules button[aria-current="page"] {
    background: var(--hyc-hover);
    border-color: transparent;
    color: var(--hyc-text);
  }

  .dashboard-content {
    min-height: 0;
    min-width: 0;
    overflow: auto;
    padding: 10px;
    ${ScrollBars()}
  }

  .dashboard-content:focus {
    outline: none;
  }

  .dashboard-notice {
    margin-bottom: 10px;
  }

  .dashboard-empty {
    display: grid;
    gap: 10px;
    justify-items: start;
  }

  button:focus-visible,
  select:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }

  /* 不支持容器查询时保留随容器比例收缩的竖向导航。 */
  @container dashboard (min-width: 560px) {
    .dashboard-sidebar {
      padding: 10px 6px;
    }

    .dashboard-modules > button {
      flex-direction: row;
      font-size: 12px;
      gap: 8px;
      justify-content: flex-start;
      min-height: 36px;
      padding: 7px;
      text-align: left;
    }

    .dashboard-nav-short {
      display: none;
    }

    .dashboard-nav-full {
      display: inline;
    }

    .dashboard-submodules button {
      align-items: flex-start;
      padding: 6px 7px 6px 22px;
      text-align: left;
    }

    .dashboard-content {
      padding: 14px;
    }

    .dashboard-top-actions select {
      width: 126px;
    }
  }

  @container dashboard (min-width: 860px) {
    .dashboard-content {
      padding: 16px;
    }

    .dashboard-modules > button {
      padding: 9px;
    }
  }
`;
const StatusBar = styled(StyledStatusBar)`
  align-items: center;
  border-top: 1px solid var(--hyc-line);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  gap: 4px 12px;
  height: auto;
  max-height: 144px;
  min-height: 28px;
  min-width: 0;
  overflow: auto;
  padding: 4px 9px;
  position: static;
  white-space: normal;
  width: auto;
  ${ScrollBars()}

  .dashboard-status-end {
    margin-left: auto;
  }

  .dashboard-memory {
    color: var(--hyc-muted);
  }

  details {
    min-width: 0;
  }

  details[open] {
    flex-basis: 100%;
  }

  summary {
    cursor: pointer;
    width: fit-content;
  }

  summary:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }

  details p {
    color: var(--hyc-muted);
    padding-top: 4px;
  }
`;

const Dashboard = ({ id }: ComponentProcessProps): React.ReactNode => {
  const { locale } = useLifeOS();
  const t = messages[locale];
  const { title } = useProcessesActions();
  const [raw, setRaw] = useState(makeDemoData);
  const [route, setRoute] = useState<Route>(initialRoute);
  const [previewMode, setPreviewMode] = useState<"all" | "visitor">("all");
  const [dirty, setDirty] = useState(false);
  const [resetRevision, setResetRevision] = useState(0);
  const [resetNotice, setResetNotice] = useState(false);
  const dirtyRef = useRef(false);
  const currentRoute = useRef(route);
  const currentDashboardUrl = useRef("");
  const currentHistoryIndex = useRef(0);
  const historySession = useRef("");
  const contentRef = useRef<HTMLElement>(null);
  const onDirtyChange = useCallback((value: boolean): void => {
    dirtyRef.current = value;
    setDirty(value);
  }, []);
  const canLeave = useCallback(
    (): boolean => !dirtyRef.current || confirm(t.leaveConfirm),
    [t.leaveConfirm]
  );
  const replaceRoute = useCallback((next: Route): void => {
    currentRoute.current = next;
    setRoute(next);
    contentRef.current?.focus({ preventScroll: true });
    contentRef.current?.scrollTo({ left: 0, top: 0 });
  }, []);
  useEffect(() => {
    const next =
      new URLSearchParams(location.search).get("app")?.toLowerCase() ===
      "dashboard"
        ? readRoute()
        : initialRoute;
    // 初次挂载后读取浏览器路由，服务端始终使用可复现的总览状态。
    // eslint-disable-next-line react/set-state-in-effect -- 浏览器路由在挂载后初始化。
    replaceRoute(next);
    currentDashboardUrl.current = location.href;
    historySession.current = Array.from(
      crypto.getRandomValues(new Uint32Array(4)),
      (value) => value.toString(16)
    ).join("-");
    currentHistoryIndex.current = 0;
    history.replaceState(
      historyState(currentHistoryIndex.current, historySession.current),
      "",
      location.href
    );
  }, [replaceRoute]);
  useEffect(() => {
    title(id, t.title);
  }, [id, t.title, title]);
  useEffect(() => registerCloseGuard(id, canLeave), [canLeave, id]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent): void => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // eslint-disable-next-line typescript/no-deprecated -- 兼容支持范围内旧浏览器的关闭确认。
      e.returnValue = "";
    };
    addEventListener("beforeunload", guard);
    return () => removeEventListener("beforeunload", guard);
  }, []);
  useEffect(() => {
    const sync = (event: PopStateEvent): void => {
      const targetIndex = historyIndex(event.state, historySession.current);
      const isDashboard =
        new URLSearchParams(location.search).get("app")?.toLowerCase() ===
        "dashboard";
      if (!isDashboard) {
        return;
      }
      const next = readRoute();
      const previous = currentRoute.current;
      const changed =
        next.module !== previous.module ||
        next.selectedId !== previous.selectedId ||
        next.invalidModule !== previous.invalidModule;
      if (!changed) {
        currentDashboardUrl.current = location.href;
        currentHistoryIndex.current =
          targetIndex ?? currentHistoryIndex.current;
        return;
      }
      if (!canLeave()) {
        // 本实例序号不等于全局历史距离；恢复草稿所在地址会截断当前前进分支。
        currentHistoryIndex.current += 1;
        history.pushState(
          historyState(currentHistoryIndex.current, historySession.current),
          "",
          currentDashboardUrl.current
        );
        return;
      }
      onDirtyChange(false);
      replaceRoute(next);
      currentDashboardUrl.current = location.href;
      currentHistoryIndex.current = targetIndex ?? currentHistoryIndex.current;
      setResetNotice(false);
    };
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, [canLeave, onDirtyChange, replaceRoute]);

  const writeRoute = (next: Route): void => {
    const url = new URL(location.href);
    url.searchParams.set("app", "Dashboard");
    url.searchParams.set("dashboard", next.module);
    if (next.selectedId) url.searchParams.set("dashboardItem", next.selectedId);
    else url.searchParams.delete("dashboardItem");
    currentHistoryIndex.current += 1;
    history.pushState(
      historyState(currentHistoryIndex.current, historySession.current),
      "",
      url
    );
    currentDashboardUrl.current = url.href;
    replaceRoute(next);
  };
  const onNavigate: DashboardViewProps["onNavigate"] = (module, selectedId) => {
    if (
      !route.invalidModule &&
      route.module === module &&
      route.selectedId === selectedId
    ) {
      return;
    }
    if (!canLeave()) return;
    onDirtyChange(false);
    setResetNotice(false);
    writeRoute({ invalidModule: false, module, selectedId });
  };
  const onUpdate: DashboardViewProps["onUpdate"] = (update) => {
    if (previewMode === "all") setRaw(update);
  };
  const changePreview = (next: "all" | "visitor"): void => {
    if (next === previewMode || !canLeave()) return;
    onDirtyChange(false);
    setResetNotice(false);
    setPreviewMode(next);
    contentRef.current?.focus({ preventScroll: true });
  };
  const reset = (): void => {
    if (!confirm(t.resetConfirm)) return;
    onDirtyChange(false);
    setRaw(makeDemoData());
    setResetRevision((value) => value + 1);
    setResetNotice(true);
    contentRef.current?.focus({ preventScroll: true });
    if (route.selectedId || route.invalidModule) {
      writeRoute({ invalidModule: false, module: route.module });
    }
  };
  const data = selectVisibleDemoData(raw, previewMode);
  const View = views[route.module];
  const recordExists = hasSelectedRecord(data, route);
  // 列表视图在实体间切换时保留筛选；临时编辑态由对应视图清理。
  const entityKey = route.module === "personal" ? route.selectedId || "" : "";
  const viewKey = `${route.module}:${entityKey}:${previewMode}:${resetRevision}`;
  const personalTab = getPersonalTab(data.personal, route.selectedId);
  const selectedPersonalTab = personalTabs.find(
    ({ id: tabId }) => tabId === personalTab
  );
  const personalSection =
    route.module === "personal" &&
    (!route.selectedId ||
      personalTabs.some(({ id: tabId }) => tabId === route.selectedId));

  return (
    <StyledDashboard
      aria-label={t.title}
      className="hyc-dashboard hyc-surface"
      data-process={id}
    >
      <StyledNavigation as="header" className="hyc-toolbar">
        <Button
          aria-label={t.back}
          disabled={
            route.module === "overview" &&
            !route.selectedId &&
            !route.invalidModule
          }
          onClick={() =>
            onNavigate(route.selectedId ? route.module : "overview")
          }
        >
          <Back />
        </Button>
        <StyledAddressBar className="dashboard-address">
          <Icon name="grid" size={16} />
          <span>
            {t.title} › {t.modules[route.module]}
            {route.module === "personal" &&
              selectedPersonalTab &&
              ` › ${selectedPersonalTab.label[locale]}`}
            {route.selectedId && !personalSection && ` › ${t.details}`}
          </span>
        </StyledAddressBar>
        <div className="dashboard-top-actions">
          <select
            aria-label={t.preview}
            onChange={(event) =>
              changePreview(
                event.target.value === "visitor" ? "visitor" : "all"
              )
            }
            value={previewMode}
          >
            <option value="all">{t.all}</option>
            <option value="visitor">{t.visitor}</option>
          </select>
          <ActionButton
            aria-label={t.reset}
            onClick={reset}
            title={t.reset}
            type="button"
          >
            {t.resetShort}
          </ActionButton>
        </div>
      </StyledNavigation>
      <div className="dashboard-workspace">
        <aside className="dashboard-sidebar">
          <nav aria-label={t.navigation} className="dashboard-modules">
            {moduleOrder.map((module) => (
              <Fragment key={module}>
                <ActionButton
                  aria-current={module === route.module ? "page" : undefined}
                  aria-label={t.modules[module]}
                  onClick={() => onNavigate(module)}
                  title={t.modules[module]}
                  type="button"
                >
                  <Icon name={icons[module]} size={15} />
                  <span className="dashboard-nav-full">
                    {t.modules[module]}
                  </span>
                  <span className="dashboard-nav-short">
                    {t.navigationShort[module]}
                  </span>
                </ActionButton>
                {module === "personal" && route.module === "personal" && (
                  <nav
                    aria-label={t.personalNavigation}
                    className="dashboard-submodules"
                  >
                    {personalTabs.map(({ id: tabId, label, shortLabel }) => (
                      <ActionButton
                        key={tabId}
                        aria-current={
                          personalTab === tabId ? "page" : undefined
                        }
                        aria-label={label[locale]}
                        onClick={() => onNavigate("personal", tabId)}
                        title={label[locale]}
                        type="button"
                      >
                        <span className="dashboard-nav-full">
                          {label[locale]}
                        </span>
                        <span className="dashboard-nav-short">
                          {shortLabel[locale]}
                        </span>
                      </ActionButton>
                    ))}
                  </nav>
                )}
              </Fragment>
            ))}
          </nav>
        </aside>
        <main ref={contentRef} className="dashboard-content" tabIndex={-1}>
          {route.invalidModule && (
            <Notice className="dashboard-notice" role="status">
              {t.unknownModule}{" "}
              <ActionButton
                onClick={() => onNavigate("overview")}
                type="button"
              >
                {t.modules.overview}
              </ActionButton>
            </Notice>
          )}
          {resetNotice && (
            <Notice className="dashboard-notice" role="status">
              {t.resetDone}
            </Notice>
          )}
          {recordExists ? (
            <View
              key={viewKey}
              data={data}
              locale={locale}
              onDirtyChange={onDirtyChange}
              onNavigate={onNavigate}
              onUpdate={onUpdate}
              previewMode={previewMode}
              selectedId={route.selectedId}
            />
          ) : (
            <div className="dashboard-empty">
              <EmptyState title={t.missing} />
              <ActionButton
                onClick={() => onNavigate(route.module)}
                type="button"
              >
                {t.backToList}
              </ActionButton>
            </div>
          )}
        </main>
      </div>
      <StatusBar className="dashboard-status-row">
        <StatusBadge label={t.demo} />
        <time dateTime={raw.now} title={raw.now}>
          {t.sampleTime}: {formatDateTime(raw.now, locale, raw.timeZone)}{" "}
          {raw.timeZone}
        </time>
        <span className="dashboard-memory">{t.memoryHint}</span>
        <span className="dashboard-status-end" role="status">
          {dirty ? t.unsaved : t.modules[route.module]}
          {previewMode === "visitor" && ` · ${t.visitor}`}
        </span>
        <details>
          <summary>{t.demoDetails}</summary>
          <p>
            {t.demoHint} {previewMode === "visitor" && t.previewHint}
          </p>
        </details>
      </StatusBar>
    </StyledDashboard>
  );
};

export default Dashboard;
