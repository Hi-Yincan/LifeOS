import { useEffect, useRef, useState } from "react";
import { Back } from "components/apps/FileExplorer/NavigationIcons";
import StyledAddressBar from "components/apps/FileExplorer/StyledAddressBar";
import StyledNavigation from "components/apps/FileExplorer/StyledNavigation";
import { useUpdateProfile } from "components/apps/Messenger/hooks";
import { Avatar } from "components/apps/Messenger/Icons";
import {
  drawPicture,
  encodePicture,
  MAX_PICTURE_FILE_BYTES,
  PICTURE_SIZE,
  readPicture,
} from "components/apps/Messenger/picture";
import StyledPictureEditor from "components/apps/Messenger/StyledPictureEditor";
import StyledStatusBar from "components/system/Files/FileManager/StyledStatusBar";
import { usePersonalOS } from "components/system/PersonalOS/context";
import Button from "styles/common/Button";

const messages = {
  en: {
    back: "Back",
    browse: "Browse…",
    cancel: "Cancel",
    choose: "Choose picture",
    crop: "Preview and crop",
    empty: "No picture selected",
    file: "Picture file",
    formats: "JPG, PNG, WebP · Up to 10 MB",
    hint: "Adjust the size and position of your picture.",
    horizontal: "Horizontal position",
    invalid: "Choose a JPG, PNG or WebP image up to 10 MB.",
    loading: "Loading picture…",
    preview: "Circular picture preview",
    readError: "This image could not be opened. Try another picture.",
    save: "Save picture",
    saveError:
      "The picture could not be saved. Check your relay connection and try again.",
    saving: "Saving…",
    title: "Edit picture",
    vertical: "Vertical position",
    zoom: "Zoom",
  },
  zh: {
    back: "返回",
    browse: "浏览…",
    cancel: "取消",
    choose: "选择图片",
    crop: "预览与裁剪",
    empty: "尚未选择图片",
    file: "图片文件",
    formats: "JPG、PNG、WebP · 不超过 10 MB",
    hint: "调整图片的大小和位置。",
    horizontal: "水平位置",
    invalid: "请选择不超过 10 MB 的 JPG、PNG 或 WebP 图片。",
    loading: "正在读取图片…",
    preview: "圆形头像预览",
    readError: "无法打开这张图片，请选择其他图片。",
    save: "保存头像",
    saveError: "头像保存失败，请检查中继连接后重试。",
    saving: "正在保存…",
    title: "修改头像",
    vertical: "垂直位置",
    zoom: "缩放",
  },
};

const PictureEditor: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { locale } = usePersonalOS();
  const text = messages[locale];
  const updateProfile = useUpdateProfile();
  const [image, setImage] = useState<HTMLImageElement>();
  const [fileName, setFileName] = useState("");
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"invalid" | "readError" | "saveError">();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const browseRef = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const pendingSave = useRef(false);

  useEffect(() => {
    browseRef.current?.focus();

    return () => {
      request.current += 1;
    };
  }, []);

  useEffect(() => {
    if (image && canvasRef.current) {
      drawPicture(canvasRef.current, image, zoom, horizontal, vertical);
    }
  }, [horizontal, image, vertical, zoom]);

  const loadPicture = (file: File): void => {
    const currentRequest = ++request.current;

    setError(undefined);
    setImage(undefined);
    setFileName(file.name);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_PICTURE_FILE_BYTES
    ) {
      setError("invalid");
      return;
    }

    setLoading(true);
    readPicture(file)
      .then((nextImage) => {
        if (currentRequest !== request.current) return;

        setZoom(1);
        setHorizontal(50);
        setVertical(50);
        setImage(nextImage);
      })
      .catch(() => {
        if (currentRequest === request.current) setError("readError");
      })
      .finally(() => {
        if (currentRequest === request.current) setLoading(false);
      });
  };
  const save = (): void => {
    if (!image || !canvasRef.current || pendingSave.current) return;

    pendingSave.current = true;
    setSaving(true);
    setError(undefined);
    const canvas = canvasRef.current;

    Promise.resolve()
      .then(() => updateProfile({ picture: encodePicture(canvas) }))
      .then(onClose)
      .catch(() => {
        setError("saveError");
      })
      .finally(() => {
        pendingSave.current = false;
        setSaving(false);
      });
  };

  return (
    <StyledPictureEditor
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
        <span className="file-label">{text.file}</span>
        <div className="file-row">
          <span className="file-name" title={fileName || text.empty}>
            {fileName || text.empty}
          </span>
          <Button
            ref={browseRef}
            disabled={loading || saving}
            onClick={() => inputRef.current?.click()}
          >
            {text.browse}
          </Button>
        </div>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp"
          aria-label={text.choose}
          disabled={loading || saving}
          onChange={({ currentTarget }) => {
            const [file] = currentTarget.files || [];

            if (file) loadPicture(file);
          }}
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
          }}
          type="file"
        />
        <fieldset>
          <legend>{text.crop}</legend>
          <div className="crop">
            <div className="picture-preview">
              {image ? (
                <canvas
                  ref={canvasRef}
                  aria-label={text.preview}
                  height={PICTURE_SIZE}
                  role="img"
                  width={PICTURE_SIZE}
                />
              ) : (
                <Avatar />
              )}
            </div>
            <div className="crop-controls">
              {(
                [
                  ["zoom", zoom, setZoom, 1, 3, 0.05],
                  ["horizontal", horizontal, setHorizontal, 0, 100, 1],
                  ["vertical", vertical, setVertical, 0, 100, 1],
                ] as const
              ).map(([name, value, setValue, min, max, step]) => (
                <label key={name}>
                  <span className="range-label">
                    {text[name]}
                    <output aria-hidden="true">
                      {Math.round(name === "zoom" ? value * 100 : value)}%
                    </output>
                  </span>
                  <input
                    aria-label={text[name]}
                    disabled={!image || saving}
                    max={max}
                    min={min}
                    onChange={({ currentTarget }) =>
                      setValue(Number(currentTarget.value))
                    }
                    step={step}
                    type="range"
                    value={value}
                  />
                </label>
              ))}
            </div>
          </div>
          <p className="picture-hint">{text.hint}</p>
        </fieldset>
        {error && (
          <p className="picture-error" role="alert">
            {text[error]}
          </p>
        )}
      </div>
      <footer className="picture-actions">
        <Button
          className="hyc-primary"
          disabled={!image || loading || saving}
          onClick={save}
        >
          {saving ? text.saving : text.save}
        </Button>
        <Button disabled={saving} onClick={onClose}>
          {text.cancel}
        </Button>
      </footer>
      <StyledStatusBar className="picture-status" role="status">
        {loading ? text.loading : saving ? text.saving : text.formats}
      </StyledStatusBar>
    </StyledPictureEditor>
  );
};

export default PictureEditor;
