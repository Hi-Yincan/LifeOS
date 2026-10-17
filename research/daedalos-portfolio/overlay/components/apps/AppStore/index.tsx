import { useEffect, useState } from "react";
import { catalog, type CatalogApp } from "components/apps/AppStore/catalog";
import {
  emptyLibrary,
  externalURL,
  type Library,
  parseManifest,
  readLibrary,
  STORAGE_KEY,
  type WebApp,
} from "components/apps/AppStore/model";
import { Back } from "components/apps/FileExplorer/NavigationIcons";
import StyledAddressBar from "components/apps/FileExplorer/StyledAddressBar";
import StyledNavigation from "components/apps/FileExplorer/StyledNavigation";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledStatusBar from "components/system/Files/FileManager/StyledStatusBar";
import { usePersonalOS } from "components/system/PersonalOS/context";
import Icon from "components/system/PersonalOS/Icon";
import Surface from "components/system/PersonalOS/Surface";
import useLaunch from "components/system/PersonalOS/useLaunch";
import { useProcessesActions } from "contexts/process";
import Button from "styles/common/Button";
import NativeIcon from "styles/common/Icon";

type StoreError =
  "" | "capacity" | "conflict" | "duplicate" | "invalid" | "storage";
type Filter = "adapted" | "native" | "thirdParty";
const messages = {
  en: {
    adapted: "Application software",
    add: "Add web app",
    added: "Added",
    all: "All apps",
    back: "Back to apps",
    builtIn: "Built in",
    builtinCount: "built in",
    cancel: "Cancel",
    capacity: "You can add up to 100 web apps.",
    confirm:
      "Remove only this local app record? The external website and its data will remain.",
    conflict:
      "The library changed in another window. Reopen the store before editing.",
    count: "apps",
    description: "Description (optional)",
    detail: "Details",
    disable: "Disable",
    disabled: "Disabled",
    duplicate: "This URL is already in your library.",
    empty: "No matching apps",
    enable: "Enable",
    external: "External browser tab",
    favorite: "Favorite app",
    fileHint: "Choose a compatible file, then use its Open with menu.",
    files: "Choose a file",
    hint: "Try another search or add your own web app.",
    import: "Import and add",
    invalid:
      "Invalid manifest. Check the name and external HTTPS URL. Scripts, this site and local addresses are not supported.",
    local: "Local library · This browser only",
    manifest: "Import JSON manifest",
    manifestHint:
      "Supports name, nameEn, url and description. Paste, then import.",
    mode: "Launch mode",
    name: "Name (original language)",
    nameEn: "English name (optional)",
    native: "System software",
    nativeHint:
      "Built-in apps remain available. Favorites are saved only in this browser.",
    open: "Open",
    origin: "Destination",
    process: "Native daedalOS window",
    provisional:
      "Third-party research proposal: URL manifests. Code packages and site publication remain open decisions.",
    readonly:
      "No code package is installed and no site administration access is granted.",
    remove: "Remove",
    save: "Add to this browser",
    saved: "Saved in this browser",
    search: "Search apps",
    source: "Source",
    storage:
      "Cannot read or save this library. Existing data was not overwritten. Check browser storage.",
    thirdParty: "Third-party",
    title: "App Store",
    unfavorite: "Unfavorite app",
    url: "App URL (HTTPS)",
    webCount: "custom",
    webHint:
      "Web apps open in a new browser tab. Adding, disabling and removing affect only this browser, without publishing to the site.",
  },
  zh: {
    adapted: "应用软件",
    add: "添加网页应用",
    added: "已添加",
    all: "全部应用",
    back: "返回应用列表",
    builtIn: "已内置",
    builtinCount: "项内置",
    cancel: "取消",
    capacity: "本机最多添加 100 个网页应用。",
    confirm: "仅移除此网页应用的本机记录？外部网站及其数据不会被删除。",
    conflict: "应用库已在其他窗口更新，请重新打开商店后操作。",
    count: "个应用",
    description: "简介（选填）",
    detail: "详情",
    disable: "停用",
    disabled: "已停用",
    duplicate: "此网址已经在应用库中。",
    empty: "没有符合条件的应用",
    enable: "启用",
    external: "外部浏览器标签",
    favorite: "收藏应用",
    fileHint: "先选择兼容文件，再通过文件的打开方式使用此应用。",
    files: "选择文件",
    hint: "搜索其他关键词，或添加你自己的网页应用。",
    import: "导入并添加",
    invalid:
      "应用清单无效。请检查名称与 HTTPS 外部网址；不支持脚本、本站或本地地址。",
    local: "本机应用库 · 仅此浏览器",
    manifest: "导入 JSON 应用清单",
    manifestHint: "支持 name、nameEn、url、description；粘贴后点击导入。",
    mode: "运行方式",
    name: "名称（中文或原文）",
    nameEn: "英文名称（选填）",
    native: "系统软件",
    nativeHint:
      "内置应用始终保留可用。收藏记录仅保存在此浏览器。",
    open: "打开",
    origin: "目标网站",
    process: "daedalOS 原生窗口",
    provisional: "第三方接入研究方案：URL 清单；代码包运行与站点发布待确认。",
    readonly: "不会安装代码包或授予站点管理权限。",
    remove: "移除",
    save: "添加到本机",
    saved: "已保存到此浏览器",
    search: "搜索应用",
    source: "应用来源",
    storage: "无法读取或保存本机应用库。原有数据未覆盖，请检查浏览器存储。",
    thirdParty: "第三方",
    title: "应用商店",
    unfavorite: "取消收藏",
    url: "应用网址（HTTPS）",
    webCount: "项自建",
    webHint:
      "网页应用在新的浏览器标签中打开。添加、停用与移除仅影响本机应用库，不会发布到网站。",
  },
};
const isWeb = (app: CatalogApp | WebApp): app is WebApp => "url" in app;

const AppStore = ({ id }: ComponentProcessProps): React.ReactNode => {
  const { locale } = usePersonalOS();
  const t = messages[locale];
  const { title } = useProcessesActions();
  const launch = useLaunch();
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [baseline, setBaseline] = useState("");
  const [error, setError] = useState<StoreError>("");
  const [notice, setNotice] = useState(false);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [removing, setRemoving] = useState("");
  const [adding, setAdding] = useState(false);
  const [manifest, setManifest] = useState("");
  useEffect(() => {
    title(id, t.title);
  }, [id, t.title, title]);
  useEffect(() => {
    const read = (): void => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setLibrary(readLibrary(raw, location.origin));
        setBaseline(raw || "");
        setReady(true);
        setError("");
      } catch {
        setReady(false);
        setError("storage");
      }
    };
    const sync = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY || event.key === null) read();
    };
    read();
    addEventListener("storage", sync);
    return () => removeEventListener("storage", sync);
  }, []);
  const save = (next: Library): boolean => {
    if (!ready) return false;
    try {
      if ((localStorage.getItem(STORAGE_KEY) || "") !== baseline) {
        setError("conflict");
        return false;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, raw);
      setBaseline(raw || "");
      setLibrary(next);
      setError("");
      setNotice(true);
      return true;
    } catch {
      setError("storage");
      return false;
    }
  };
  const add = (data: unknown): void => {
    try {
      const value = parseManifest(data, location.origin);
      if (library.apps.some((app) => app.url === value.url)) {
        setError("duplicate");
        return;
      }
      if (library.apps.length >= 100) {
        setError("capacity");
        return;
      }
      const app = { ...value, enabled: true, id: `web-${crypto.randomUUID()}` };
      if (save({ ...library, apps: [...library.apps, app] })) {
        setAdding(false);
        setManifest("");
        setSelectedId(app.id);
      }
    } catch {
      setError("invalid");
    }
  };
  const appName = (app: CatalogApp | WebApp): string =>
    isWeb(app)
      ? locale === "en"
        ? app.nameEn
        : app.name
      : app.id === "AppStore"
        ? t.title
        : app.id === "Portfolio" && locale === "zh"
          ? "个人作品集"
          : app.name;
  const sourceName = (app: CatalogApp | WebApp): string =>
    isWeb(app) ? t.thirdParty : t[app.source];
  const description = (app: CatalogApp | WebApp): string =>
    isWeb(app) ? app.description : app.description[locale === "zh" ? 0 : 1];
  const apps: (CatalogApp | WebApp)[] = [...catalog, ...library.apps];
  const selected = apps.find((app) => app.id === selectedId);
  const visible = apps.filter(
    (app) =>
      (!filter ||
        (filter === "thirdParty"
          ? isWeb(app)
          : !isWeb(app) && app.source === filter)) &&
      `${appName(app)} ${description(app)} ${app.id}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
  );
  const reset = (): void => {
    setSelectedId("");
    setRemoving("");
    setAdding(false);
    if (ready) setError("");
    setNotice(false);
  };
  const actions = (app: CatalogApp | WebApp): React.ReactNode => (
    <div className="hyc-actions">
      {isWeb(app) ? (
        app.enabled && (
          <a
            className="hyc-primary"
            href={externalURL(app.url, location.origin)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t.open}
            <Icon name="arrow" size={14} />
          </a>
        )
      ) : (
        <button
          className="hyc-primary"
          onClick={() => launch(app.fileBased ? "FileExplorer" : app.id)}
          type="button"
        >
          {app.fileBased ? t.files : t.open}
        </button>
      )}
      {isWeb(app) ? (
        <>
          <button
            disabled={!ready}
            onClick={() =>
              save({
                ...library,
                apps: library.apps.map((item) =>
                  item.id === app.id
                    ? { ...item, enabled: !item.enabled }
                    : item
                ),
              })
            }
            type="button"
          >
            {app.enabled ? t.disable : t.enable}
          </button>
          <button
            disabled={!ready}
            onClick={() => {
              if (removing !== app.id) {
                setRemoving(app.id);
                return;
              }
              if (
                removing === app.id &&
                save({
                  ...library,
                  apps: library.apps.filter((item) => item.id !== app.id),
                })
              ) {
                setSelectedId("");
              }
            }}
            type="button"
          >
            {removing === app.id ? t.confirm : t.remove}
          </button>
          {removing === app.id && (
            <button onClick={() => setRemoving("")} type="button">
              {t.cancel}
            </button>
          )}
        </>
      ) : (
        <button
          disabled={!ready}
          onClick={() =>
            save({
              ...library,
              favorites: library.favorites.includes(app.id)
                ? library.favorites.filter((item) => item !== app.id)
                : [...library.favorites, app.id],
            })
          }
          type="button"
        >
          {library.favorites.includes(app.id) ? t.unfavorite : t.favorite}
        </button>
      )}
    </div>
  );
  return (
    <Surface aria-label={t.title} className="hyc-surface hyc-store">
      <StyledNavigation className="hyc-toolbar">
        <Button
          aria-label={t.back}
          disabled={!selected && !adding}
          onClick={reset}
        >
          <Back />
        </Button>
        <StyledAddressBar className="hyc-address">
          <NativeIcon
            alt=""
            imgSize={16}
            src="/System/PersonalOS/store.svg"
            $eager
          />
          <span>
            {t.title}
            <span className="hyc-path-separator">›</span>
            {adding ? t.add : selected ? appName(selected) : t[filter ?? "all"]}
          </span>
        </StyledAddressBar>
      </StyledNavigation>
      <div className="hyc-store-controls">
        <nav aria-label={t.title} className="hyc-segments">
          {(["native", "adapted", "thirdParty"] as Filter[]).map((value) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                reset();
                setFilter((current) => (current === value ? undefined : value));
              }}
              type="button"
            >
              {t[value]}
            </button>
          ))}
        </nav>
        <div className="hyc-store-tools">
          <label className="hyc-search">
            <Icon name="search" size={16} />
            <input
              aria-label={t.search}
              onChange={(event) => {
                reset();
                setSearch(event.target.value);
              }}
              placeholder={t.search}
              value={search}
            />
          </label>
          <button
            disabled={!ready}
            onClick={() => {
              reset();
              setAdding(true);
            }}
            type="button"
          >
            {t.add}
          </button>
        </div>
      </div>
      <main className="hyc-main">
        {error && (
          <p className="hyc-error" role="alert">
            {t[error]}
          </p>
        )}
        {notice && (
          <p className="hyc-notice" role="status">
            {t.saved}
          </p>
        )}
        {adding ? (
          <section className="hyc-store-add">
            <h1>{t.add}</h1>
            <p className="hyc-muted">{t.webHint}</p>
            <p className="hyc-muted">{t.provisional}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                add({
                  description: form.get("description"),
                  name: form.get("name"),
                  nameEn: form.get("nameEn") || form.get("name"),
                  url: form.get("url"),
                });
              }}
            >
              <label>
                {t.name}
                <input maxLength={80} name="name" required />
              </label>
              <label>
                {t.nameEn}
                <input maxLength={80} name="nameEn" />
              </label>
              <label>
                {t.url}
                <input
                  maxLength={2048}
                  name="url"
                  placeholder="https://example.com/app"
                  type="url"
                  required
                />
              </label>
              <label>
                {t.description}
                <textarea maxLength={500} name="description" rows={2} />
              </label>
              <div className="hyc-actions">
                <button className="hyc-primary" type="submit">
                  {t.save}
                </button>
                <button onClick={reset} type="button">
                  {t.cancel}
                </button>
              </div>
            </form>
            <details>
              <summary>{t.manifest}</summary>
              <p>{t.manifestHint}</p>
              <textarea
                aria-label={t.manifest}
                maxLength={10000}
                onChange={(event) => setManifest(event.target.value)}
                placeholder='{"name":"My app","url":"https://example.com/app"}'
                value={manifest}
              />
              <button
                onClick={() => {
                  try {
                    add(JSON.parse(manifest));
                  } catch {
                    setError("invalid");
                  }
                }}
                type="button"
              >
                {t.import}
              </button>
            </details>
          </section>
        ) : selected ? (
          <article className="hyc-store-detail">
            <div className="hyc-store-heading">
              <NativeIcon
                alt=""
                imgSize={48}
                src={
                  isWeb(selected)
                    ? "/System/Icons/chromium.webp"
                    : selected.icon
                }
                $eager
              />
              <div>
                <h1>{appName(selected)}</h1>
                <p className="hyc-muted">
                  {sourceName(selected)} ·{" "}
                  {isWeb(selected)
                    ? selected.enabled
                      ? t.added
                      : t.disabled
                    : t.builtIn}
                </p>
              </div>
            </div>
            <p>{description(selected)}</p>
            <dl>
              <dt>{t.source}</dt>
              <dd>{sourceName(selected)}</dd>
              <dt>{t.mode}</dt>
              <dd>{isWeb(selected) ? t.external : t.process}</dd>
              {isWeb(selected) && (
                <>
                  <dt>{t.origin}</dt>
                  <dd>{selected.url}</dd>
                </>
              )}
            </dl>
            {!isWeb(selected) && selected.fileBased && <p>{t.fileHint}</p>}
            {actions(selected)}
            <p className="hyc-muted">
              {isWeb(selected) ? t.webHint : t.nativeHint}
            </p>
            {isWeb(selected) && <p className="hyc-muted">{t.readonly}</p>}
          </article>
        ) : (
          <>
            <div className="hyc-heading-line">
              <h1>{t[filter ?? "all"]}</h1>
              <span className="hyc-muted">
                {visible.length} {t.count}
              </span>
            </div>
            <div className="hyc-store-grid">
              {visible.map((app) => (
                <article
                  key={app.id}
                  className="hyc-store-card"
                  data-app={app.id}
                >
                  <NativeIcon
                    alt=""
                    imgSize={32}
                    src={isWeb(app) ? "/System/Icons/chromium.webp" : app.icon}
                    $eager
                  />
                  <div>
                    <h2>{appName(app)}</h2>
                    <p className="hyc-muted">
                      {sourceName(app)} ·{" "}
                      {isWeb(app)
                        ? app.enabled
                          ? t.added
                          : t.disabled
                        : t.builtIn}
                    </p>
                    <p className="hyc-store-description">{description(app)}</p>
                    <button
                      aria-label={`${t.detail}: ${appName(app)}`}
                      onClick={() => {
                        setSelectedId(app.id);
                        setNotice(false);
                      }}
                      type="button"
                    >
                      {t.detail}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {visible.length === 0 && (
              <div className="hyc-empty">
                <Icon name="grid" size={32} />
                <h2>{t.empty}</h2>
                <p>{t.hint}</p>
              </div>
            )}
          </>
        )}
      </main>
      <StyledStatusBar className="hyc-statusbar">
        <span>
          {catalog.length} {t.builtinCount} · {library.apps.length} {t.webCount}
        </span>
        <span>{t.local}</span>
      </StyledStatusBar>
    </Surface>
  );
};

export default AppStore;
