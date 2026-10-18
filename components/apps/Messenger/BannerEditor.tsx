import { useEffect, useRef, useState } from "react";
import { Back } from "components/apps/FileExplorer/NavigationIcons";
import StyledAddressBar from "components/apps/FileExplorer/StyledAddressBar";
import StyledNavigation from "components/apps/FileExplorer/StyledNavigation";
import {
  BANNER_PRESETS,
  bannerPresetImage,
} from "components/apps/Messenger/bannerPresets";
import {
  useNostrProfile,
  useUpdateProfile,
} from "components/apps/Messenger/hooks";
import { useNostr } from "components/apps/Messenger/NostrContext";
import Profile from "components/apps/Messenger/Profile";
import StyledBannerEditor from "components/apps/Messenger/StyledBannerEditor";
import StyledProfileBanner from "components/apps/Messenger/StyledProfileBanner";
import StyledStatusBar from "components/system/Files/FileManager/StyledStatusBar";
import { useLifeOS } from "components/system/LifeOS/context";
import Button from "styles/common/Button";

const messages = {
  en: {
    back: "Back",
    cancel: "Cancel",
    custom: "Custom image URL",
    error:
      "The banner could not be saved. Check your relay connection and try again.",
    hint: "Select a preset to preview it.",
    invalid: "Enter an HTTP or HTTPS image URL.",
    preview: "Banner preview",
    save: "Save banner",
    saving: "Saving…",
    title: "Edit banner",
  },
  zh: {
    back: "返回",
    cancel: "取消",
    custom: "自定义图片地址",
    error: "背景图保存失败，请检查中继连接后重试。",
    hint: "选择预设以预览效果。",
    invalid: "请输入 HTTP 或 HTTPS 图片地址。",
    preview: "背景图预览",
    save: "保存背景图",
    saving: "正在保存…",
    title: "修改背景图",
  },
};

const BannerEditor: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { locale } = useLifeOS();
  const text = messages[locale];
  const { signer } = useNostr();
  const { banner, picture, userName } = useNostrProfile(signer.publicKey);
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(banner || "");
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"error" | "invalid">();
  const firstPreset = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);

  useEffect(() => firstPreset.current?.focus(), []);

  const choosePreset = (preset: (typeof BANNER_PRESETS)[number]): void => {
    setSelected(preset.id);
    setCustomUrl("");
    setError(undefined);
    setPreview(bannerPresetImage(preset.colors));
  };
  const save = (): void => {
    if (!selected || pending.current) return;
    let value = preview;

    if (selected === "custom") {
      try {
        const url = new URL(customUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          setError("invalid");
          return;
        }
        value = url.href;
      } catch {
        setError("invalid");
        return;
      }
    }

    pending.current = true;
    setSaving(true);
    setError(undefined);
    updateProfile({ banner: value })
      .then(onClose)
      .catch(() => setError("error"))
      .finally(() => {
        pending.current = false;
        setSaving(false);
      });
  };

  return (
    <StyledBannerEditor
      aria-label={text.title}
      className="hyc-surface"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          if (!saving) onClose();
        }
      }}
    >
      <StyledNavigation className="hyc-toolbar picture-navigation">
        <Button aria-label={text.back} disabled={saving} onClick={onClose}>
          <Back />
        </Button>
        <StyledAddressBar className="hyc-address">
          <span className="picture-path">Messenger</span>
          <span aria-hidden="true" className="hyc-path-separator">
            ›
          </span>
          <h2>{text.title}</h2>
        </StyledAddressBar>
      </StyledNavigation>
      <div className="picture-body">
        <StyledProfileBanner
          aria-label={text.preview}
          className="banner-preview"
          role="img"
          style={
            preview
              ? {
                  backgroundImage: `linear-gradient(transparent, rgba(0,0,0,0.5)), url(${JSON.stringify(preview)})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          <Profile picture={picture} userName={userName} />
        </StyledProfileBanner>
        <div aria-label={text.title} className="banner-presets">
          {BANNER_PRESETS.map((preset, index) => (
            <Button
              key={preset.id}
              ref={index === 0 ? firstPreset : undefined}
              aria-pressed={selected === preset.id}
              disabled={saving}
              onClick={() => choosePreset(preset)}
            >
              <span
                aria-hidden="true"
                className="banner-swatch"
                style={{
                  background: `linear-gradient(to right, ${preset.colors.join(", ")})`,
                }}
              />
              <span className="banner-name">{preset[locale]}</span>
            </Button>
          ))}
        </div>
        <details>
          <summary>{text.custom}</summary>
          <label>
            {text.custom}
            <input
              disabled={saving}
              onChange={({ currentTarget }) => {
                setCustomUrl(currentTarget.value);
                setPreview(
                  /^https?:\/\//.test(currentTarget.value.trim())
                    ? currentTarget.value.trim()
                    : ""
                );
                setSelected("custom");
                setError(undefined);
              }}
              type="url"
              value={customUrl}
            />
          </label>
        </details>
        {error && (
          <p className="picture-error" role="alert">
            {text[error]}
          </p>
        )}
      </div>
      <footer className="picture-actions">
        <Button
          className="hyc-primary"
          disabled={!selected || saving}
          onClick={save}
        >
          {saving ? text.saving : text.save}
        </Button>
        <Button disabled={saving} onClick={onClose}>
          {text.cancel}
        </Button>
      </footer>
      <StyledStatusBar className="picture-status" role="status">
        {saving ? text.saving : text.hint}
      </StyledStatusBar>
    </StyledBannerEditor>
  );
};

export default BannerEditor;
