import { useEffect, useRef, useState } from "react";
import { useProcesses, useProcessesActions } from "contexts/process";
import directory from "contexts/process/directory";
import { useSessionActions, useSessionLoaded } from "contexts/session";
import { usePersonalOS } from "components/system/PersonalOS/context";
import Icon from "components/system/PersonalOS/Icon";
import useLaunch from "components/system/PersonalOS/useLaunch";

export default function PersonalShell(): React.ReactNode {
  const { t, mode, route } = usePersonalOS(); const { minimize } = useProcessesActions(); const open = useLaunch();
  const { setForegroundId: focus } = useSessionActions(); const processes = useProcesses(); const loaded = useSessionLoaded();
  const started = useRef(false), [drawer, setDrawer] = useState(false), [recent, setRecent] = useState(false);
  useEffect(() => { if (!loaded || started.current) return; started.current = true; const params = new URLSearchParams(location.search); if (!params.has("app") && !params.has("url")) open("Portfolio"); }, [loaded, open]);
  useEffect(() => { if (!loaded) return; const params = new URLSearchParams(location.search); if (params.get("app") === "Portfolio") open("Portfolio"); }, [route, loaded, open]);
  // Touch layouts fill the viewport with CSS without mutating the desktop
  // window's saved size/position or native maximized state.
  const activate = (id: string): void => { if (processes[id]?.minimized) minimize(id); focus(id); setDrawer(false); setRecent(false); };
  const launch = (id: string): void => { open(id); setDrawer(false); setRecent(false); };
  if (mode === "desktop") return <div className="hyc-desktop-tools"><button title={t("portfolio")} aria-label={t("portfolio")} onClick={() => launch("Portfolio")}><Icon name="grid"/></button><button title={t("settings")} aria-label={t("settings")} onClick={() => launch("SystemSettings")}><Icon name="settings"/></button></div>;
  return <>
    <div className="hyc-mobile-home hyc-surface"><div className="hyc-mobile-clock">{new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date())}</div><p>{t("desktopHint")}</p><button className="hyc-launch-portfolio" onClick={() => launch("Portfolio")}><span><Icon name="grid" size={30}/></span><strong>{t("portfolio")}</strong><small>Yincan Huang</small></button></div>
    {(drawer || recent) && <section className="hyc-mobile-drawer hyc-surface" aria-label={drawer ? t("nativeApps") : t("recent")}><div className="hyc-heading-line"><h2>{drawer ? t("nativeApps") : t("recent")}</h2><button aria-label={t("close")} onClick={() => { setDrawer(false); setRecent(false); }}><Icon name="close"/></button></div><div className="hyc-app-grid">{drawer ? Object.entries(directory).filter(([, value]) => !value.dialogProcess && value.hasWindow !== false).map(([id, value]) => <button key={id} onClick={() => launch(id)}><img src={value.icon} alt=""/><span>{id === "Portfolio" ? t("portfolio") : id === "SystemSettings" ? t("settings") : value.title}</span></button>) : Object.entries(processes).map(([id, value]) => <button key={id} onClick={() => activate(id)}><img src={value.icon} alt=""/><span>{value.title}</span></button>)}</div>{recent && !Object.keys(processes).length && <p>{t("none")}</p>}</section>}
    <nav className="hyc-mobile-bar" aria-label="OS navigation"><button aria-label={t("nativeApps")} onClick={() => { setDrawer(!drawer); setRecent(false); }}><Icon name="grid"/></button><button aria-label={t("home")} onClick={() => { for (const [id, value] of Object.entries(processes)) if (!value.minimized) minimize(id); setDrawer(false); setRecent(false); }}><Icon name="home"/></button><button aria-label={t("recent")} aria-pressed={recent} onClick={() => { setRecent(!recent); setDrawer(false); }}><Icon name="list"/></button><button aria-label={t("settings")} onClick={() => launch("SystemSettings")}><Icon name="settings"/></button></nav>
  </>;
}
