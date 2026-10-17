import { useEffect, useState } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import {
  type Session,
  usePersonalOS,
} from "components/system/PersonalOS/context";
import Icon from "components/system/PersonalOS/Icon";
import Surface from "components/system/PersonalOS/Surface";
import useLaunch from "components/system/PersonalOS/useLaunch";
import { useProcessesActions } from "contexts/process";

const Settings = ({ id }: ComponentProcessProps): React.ReactNode => {
  const {
    applySession,
    errorText,
    preferences,
    request,
    session,
    setPreference,
    t,
  } = usePersonalOS();
  const open = useLaunch();
  const { title } = useProcessesActions();
  useEffect(() => {
    title(id, t("settings"));
  }, [id, t, title]);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [key, setKey] = useState("");
  return (
    <Surface
      aria-label={t("settings")}
      className="hyc-settings hyc-surface"
      data-process={id}
    >
      <div className="hyc-settings-heading">
        <span className="hyc-settings-symbol">
          <Icon name="settings" size={28} />
        </span>
        <div>
          <h1>{t("settings")}</h1>
          <p>Personal OS</p>
        </div>
      </div>
      <section className="hyc-setting-group">
        <h2>
          <Icon name="globe" />
          {t("language")}
        </h2>
        <label>
          {t("language")}
          <select
            name="os-language"
            onChange={(event) =>
              setPreference(
                "language",
                event.target.value === "zh" || event.target.value === "en"
                  ? event.target.value
                  : "auto"
              )
            }
            value={preferences.language}
          >
            <option value="auto">{t("automatic")}</option>
            <option value="zh">简体中文</option>
            <option value="en">English</option>
          </select>
        </label>
        <p>{t("preferenceHint")}</p>
        <div className="hyc-setting-meta">
          {t("timezone")}
          <span>{new Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
      </section>
      <details className="hyc-maintenance">
        <summary>
          <Icon name="lock" size={16} />
          {t("manageSection")}
        </summary>
        <p>{t("privateHint")}</p>
        {session.role === "admin" ? (
          <div className="hyc-actions">
            <button
              className="hyc-primary"
              onClick={() => open("Portfolio")}
              type="button"
            >
              {t("management")}
            </button>
            <button
              onClick={async () => {
                applySession(
                  await request<Session>("/api/session", {
                    body: "{}",
                    method: "DELETE",
                  })
                );
              }}
              type="button"
            >
              {t("logout")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setErrorMessage("");
              try {
                applySession(
                  await request<Session>("/api/session", {
                    body: JSON.stringify({ key }),
                    method: "POST",
                  })
                );
                setKey("");
                open("Portfolio");
              } catch (error) {
                setErrorMessage(errorText(error));
              }
              setBusy(false);
            }}
          >
            <label>
              {t("key")}
              <input
                autoComplete="off"
                name="administrator-key"
                onChange={(event) => setKey(event.target.value)}
                type="password"
                value={key}
                required
              />
            </label>
            <button className="hyc-primary" disabled={busy} type="submit">
              {busy ? t("loading") : t("enter")}
            </button>
          </form>
        )}
        {errorMessage && <p role="alert">{errorMessage}</p>}
      </details>
    </Surface>
  );
};

export default Settings;
