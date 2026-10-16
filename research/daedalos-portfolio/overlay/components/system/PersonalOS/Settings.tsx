import { useEffect, useState } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useProcessesActions } from "contexts/process";
import { usePersonalOS } from "components/system/PersonalOS/context";
import Icon from "components/system/PersonalOS/Icon";
import useLaunch from "components/system/PersonalOS/useLaunch";

export default function Settings({ id }: ComponentProcessProps): React.ReactNode {
  const { t, preferences, setPreference, session, applySession, request, errorText } = usePersonalOS();
  const open = useLaunch(); const { title } = useProcessesActions();
  useEffect(() => { title(id, t("settings")); }, [id, t("settings"), title]);
  const [key, setKey] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <section className="hyc-settings hyc-surface" aria-label={t("settings")} data-process={id}>
    <div className="hyc-settings-heading"><span className="hyc-settings-symbol"><Icon name="settings" size={28}/></span><div><h1>{t("settings")}</h1><p>Personal OS</p></div></div>
    <section className="hyc-setting-group"><h2><Icon name="globe"/>{t("language")}</h2><label>{t("language")}<select name="os-language" value={preferences.language} onChange={event => setPreference("language", event.target.value as any)}><option value="auto">{t("automatic")}</option><option value="zh">简体中文</option><option value="en">English</option></select></label><p>{t("preferenceHint")}</p><div className="hyc-setting-meta">{t("timezone")}<span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div></section>
    <section className="hyc-setting-group"><h2><Icon name="grid"/>{t("appearance")}</h2><label>{t("appearance")}<select name="os-theme" value={preferences.theme} onChange={event => setPreference("theme", event.target.value as any)}><option value="light">{t("light")}</option><option value="dark">{t("dark")}</option></select></label><label>{t("layout")}<select name="portfolio-layout" value={preferences.layout} onChange={event => setPreference("layout", event.target.value as any)}><option value="gallery">{t("gallery")}</option><option value="native">{t("native")}</option></select></label><label>{t("device")}<select name="os-device" value={preferences.device} onChange={event => setPreference("device", event.target.value as any)}><option value="auto">{t("deviceAuto")}</option><option value="desktop">{t("desktop")}</option><option value="tablet">{t("tablet")}</option><option value="phone">{t("phone")}</option></select></label></section>
    <details className="hyc-maintenance"><summary><Icon name="lock" size={16}/>{t("manageSection")}</summary><p>{t("privateHint")}</p>{session.role === "admin" ? <div className="hyc-actions"><button className="hyc-primary" onClick={() => open("Portfolio")}>{t("management")}</button><button onClick={async () => { applySession(await request("/api/session", { method: "DELETE", body: "{}" })); }}>{t("logout")}</button></div> : <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(""); try { applySession(await request("/api/session", { method: "POST", body: JSON.stringify({ key }) })); setKey(""); open("Portfolio"); } catch (error) { setError(errorText(error)); } finally { setBusy(false); } }}><label>{t("key")}<input name="administrator-key" type="password" autoComplete="off" value={key} required onChange={event => setKey(event.target.value)}/></label><button className="hyc-primary" disabled={busy}>{busy ? t("loading") : t("enter")}</button></form>}{error && <p role="alert">{error}</p>}</details>
  </section>;
}
