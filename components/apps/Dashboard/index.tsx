/* eslint-disable no-alert -- 沿用原生确认保护未保存示例，重置也需要明确确认。 */
import { useCallback, useEffect, useRef, useState } from "react";
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
const historyIndex = (value: unknown): number | undefined => {
  if (
    !value ||
    typeof value !== "object" ||
    !("lifeosDashboardIndex" in value)
  ) {
    return undefined;
  }
  return typeof value.lifeosDashboardIndex === "number" &&
    Number.isSafeInteger(value.lifeosDashboardIndex)
    ? value.lifeosDashboardIndex
    : undefined;
};
const historyState = (index: number): Record<string, unknown> => ({
  ...(history.state && typeof history.state === "object"
    ? (history.state as Record<string, unknown>)
    : {}),
  lifeosDashboardIndex: index,
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
  display: grid;
  grid-template-rows: 35px auto auto minmax(0, 1fr) 23px;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  position: relative;
  width: 100%;

  .dashboard-address {
    align-items: center;
    gap: 7px;
    min-width: 0;
    padding: 0 6px;
  }

  .dashboard-address > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-controls {
    background: var(--hyc-panel);
    border-bottom: 1px solid var(--hyc-line);
    display: grid;
    gap: 6px;
    padding: 8px 12px;
  }

  .dashboard-control-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dashboard-control-row label {
    align-items: center;
    display: flex;
    gap: 6px;
    margin-left: auto;
  }

  .dashboard-control-row select {
    width: auto;
  }

  .dashboard-hint {
    color: var(--hyc-muted);
    font-size: 11px;
  }

  .dashboard-modules {
    border-bottom: 1px solid var(--hyc-line);
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 5px 8px;
  }

  .dashboard-modules button {
    background: transparent;
    border-color: transparent;
    gap: 5px;
  }

  .dashboard-modules button[aria-current="page"] {
    background: var(--hyc-selected);
    border-color: var(--hyc-selected-border);
  }

  .dashboard-content {
    min-height: 0;
    min-width: 0;
    overflow: auto;
    padding: 14px;
    ${ScrollBars()}
  }

  .dashboard-content:focus {
    outline: none;
  }

  .dashboard-notice {
    margin-bottom: 12px;
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
`;
const StatusBar = styled(StyledStatusBar)`
  gap: 10px;
  min-width: 0;
  overflow: hidden;
  position: static;
  width: auto;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span:last-child {
    margin-left: auto;
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
  const currentUrl = useRef("");
  const currentHistoryIndex = useRef(0);
  const restoringHistory = useRef(false);
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
    currentUrl.current = location.href;
    currentHistoryIndex.current = historyIndex(history.state) ?? 0;
    history.replaceState(
      historyState(currentHistoryIndex.current),
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
      const targetIndex = historyIndex(event.state);
      if (restoringHistory.current) {
        restoringHistory.current = false;
        currentUrl.current = location.href;
        return;
      }
      const isDashboard =
        new URLSearchParams(location.search).get("app")?.toLowerCase() ===
        "dashboard";
      if (!isDashboard) {
        currentUrl.current = location.href;
        currentHistoryIndex.current =
          targetIndex ?? currentHistoryIndex.current;
        return;
      }
      const next = readRoute();
      const previous = currentRoute.current;
      const changed =
        next.module !== previous.module ||
        next.selectedId !== previous.selectedId ||
        next.invalidModule !== previous.invalidModule;
      if (!changed) {
        currentUrl.current = location.href;
        currentHistoryIndex.current =
          targetIndex ?? currentHistoryIndex.current;
        return;
      }
      if (!canLeave()) {
        const delta =
          targetIndex === undefined
            ? 0
            : currentHistoryIndex.current - targetIndex;
        if (delta) {
          restoringHistory.current = true;
          history.go(delta);
        } else {
          history.pushState(
            historyState(currentHistoryIndex.current),
            "",
            currentUrl.current
          );
        }
        return;
      }
      onDirtyChange(false);
      replaceRoute(next);
      currentUrl.current = location.href;
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
    history.pushState(historyState(currentHistoryIndex.current), "", url);
    currentUrl.current = url.href;
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
  const viewKey = `${route.module}:${route.selectedId || ""}:${previewMode}:${resetRevision}`;

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
            {route.selectedId && ` › ${t.details}`}
          </span>
        </StyledAddressBar>
      </StyledNavigation>
      <div className="dashboard-controls">
        <div className="dashboard-control-row">
          <StatusBadge label={t.demo} />
          <span>
            {t.sampleTime}: {formatDateTime(raw.now, locale, raw.timeZone)}{" "}
            {raw.timeZone}
          </span>
          <label>
            {t.preview}
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
          </label>
          <ActionButton onClick={reset} type="button">
            {t.reset}
          </ActionButton>
        </div>
        <p className="dashboard-hint">
          {t.demoHint}
          {previewMode === "visitor" && ` ${t.previewHint}`}
        </p>
      </div>
      <nav aria-label={t.navigation} className="dashboard-modules">
        {moduleOrder.map((module) => (
          <ActionButton
            key={module}
            aria-current={module === route.module ? "page" : undefined}
            onClick={() => onNavigate(module)}
            type="button"
          >
            <Icon name={icons[module]} size={15} />
            {t.modules[module]}
          </ActionButton>
        ))}
      </nav>
      <main ref={contentRef} className="dashboard-content" tabIndex={-1}>
        {route.invalidModule && (
          <Notice className="dashboard-notice" role="status">
            {t.unknownModule}{" "}
            <ActionButton onClick={() => onNavigate("overview")} type="button">
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
      <StatusBar>
        <span>
          {t.modules[route.module]} ·{" "}
          {previewMode === "visitor" ? t.visitor : t.windowOnly}
        </span>
        <span>{dirty ? t.unsaved : t.demo}</span>
      </StatusBar>
    </StyledDashboard>
  );
};

export default Dashboard;
