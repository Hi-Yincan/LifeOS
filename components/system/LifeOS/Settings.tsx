import { useEffect } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useLifeOS } from "components/system/LifeOS/context";
import Icon from "components/system/LifeOS/Icon";
import Surface from "components/system/LifeOS/Surface";
import { useProcessesActions } from "contexts/process";

const Settings = ({ id }: ComponentProcessProps): React.ReactNode => {
  const { preferences, setPreference, t } = useLifeOS();
  const { title } = useProcessesActions();
  useEffect(() => {
    title(id, t("settings"));
  }, [id, t, title]);
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
          <p>LifeOS</p>
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
    </Surface>
  );
};

export default Settings;
