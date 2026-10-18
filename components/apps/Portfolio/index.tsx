/* eslint-disable no-alert -- Native confirmations protect unsaved editor content. */
import { useEffect, useState } from "react";
import { Back } from "components/apps/FileExplorer/NavigationIcons";
import StyledAddressBar from "components/apps/FileExplorer/StyledAddressBar";
import StyledNavigation from "components/apps/FileExplorer/StyledNavigation";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledStatusBar from "components/system/Files/FileManager/StyledStatusBar";
import { registerCloseGuard } from "components/system/PersonalOS/closeGuards";
import {
  type Locale,
  type Profile,
  type Project,
  type ProjectText,
  usePersonalOS,
} from "components/system/PersonalOS/context";
import Icon from "components/system/PersonalOS/Icon";
import Surface from "components/system/PersonalOS/Surface";
import { useProcessesActions } from "contexts/process";
import Button from "styles/common/Button";

/* eslint-disable perfectionist/sort-objects -- 分类按产品、工具、贡献、其他的界面顺序显示。 */
const projectCategories = {
  project: "products",
  tool: "tools",
  contribution: "contributed",
  other: "other",
} as const;
/* eslint-enable perfectionist/sort-objects */

const coverSymbols: Record<string, string> = {
  agentero: "spark",
  aipm: "book",
  multica: "code",
  videonote: "play",
};
const projectText = (item: Project, locale: Locale): ProjectText =>
  item.translations[locale] || item.translations.en || item.translations.zh;

const Cover = ({
  item,
  large = false,
}: {
  item: Project;
  large?: boolean;
}): React.ReactNode => {
  if (item.imageUrl) {
    return (
      <div
        className={`hyc-project-cover hyc-uploaded ${large ? "hyc-cover-large" : ""}`}
      >
        <img alt={item.translations.en.title} src={item.imageUrl} />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`hyc-project-cover ${large ? "hyc-cover-large" : ""}`}
    >
      <Icon name={coverSymbols[item.id] || "code"} size={large ? 42 : 32} />
      <span>{item.translations.en.title}</span>
    </div>
  );
};

const Editor = ({
  item,
  onChange,
  onClose,
  processId,
}: {
  item: Project;
  onChange: () => void;
  onClose: () => void;
  processId: string;
}): React.ReactNode => {
  const { errorText, locale, request, t } = usePersonalOS();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(item);
  const [notice, setNotice] = useState("");
  useEffect(
    () =>
      registerCloseGuard(processId, () => !dirty || confirm(t("leaveConfirm"))),
    [processId, dirty, t]
  );
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent): void => {
      if (dirty) {
        event.preventDefault();
        // eslint-disable-next-line no-param-reassign, typescript/no-deprecated -- Required by older supported browsers for the unsaved-changes prompt.
        event.returnValue = "";
      }
    };
    addEventListener("beforeunload", guard);
    return () => removeEventListener("beforeunload", guard);
  }, [dirty]);
  const update = <K extends keyof Project>(key: K, value: Project[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setNotice("");
  };
  const updateText = (key: keyof ProjectText, value: string): void => {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: { ...current.translations[locale], [key]: value },
      },
    }));
    setDirty(true);
    setNotice("");
  };
  const save = async (): Promise<Project> => {
    const {
      accent,
      kind,
      order,
      privateNote,
      repository,
      technology,
      translations,
      version,
      video,
      website,
    } = form;
    const saved = await request<Project>(`/api/admin/projects/${item.id}`, {
      body: JSON.stringify({
        accent,
        kind,
        order,
        privateNote: privateNote || "",
        repository,
        technology,
        translations,
        version,
        video,
        website,
      }),
      method: "PATCH",
    });
    setForm(saved);
    setDirty(false);
    onChange();
    return saved;
  };
  const act = async (operation: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setErrorMessage("");
    try {
      await operation();
    } catch (error) {
      setErrorMessage(errorText(error));
    }
    setBusy(false);
  };
  const text = projectText(form, locale);
  return (
    <div aria-label={t("edit")} className="hyc-editor">
      <div className="hyc-editor-top">
        <button
          className="hyc-text-button"
          onClick={() => {
            if (!dirty || confirm(t("leaveConfirm"))) onClose();
          }}
          type="button"
        >
          <Icon name="back" size={16} />
          {t("preview")}
        </button>
        <span className={`hyc-status-chip ${dirty ? "hyc-is-dirty" : ""}`}>
          {dirty ? t("unsaved") : form.published ? t("published") : t("draft")}
        </span>
      </div>
      <div className="hyc-heading-line">
        <div>
          <span className="hyc-eyebrow">
            {locale === "zh" ? "中文内容" : "ENGLISH CONTENT"}
          </span>
          <h1>{t("edit")}</h1>
        </div>
        <span className="hyc-editor-language">{locale.toUpperCase()}</span>
      </div>
      <p className="hyc-muted">{t("draftExplanation")}</p>
      {notice && (
        <div className="hyc-notice" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}
      {errorMessage && (
        <div className="hyc-error" role="alert">
          {errorMessage}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          act(async () => {
            await save();
            setNotice(t("saved"));
          });
        }}
      >
        <div className="hyc-form-grid">
          <label>
            {t("title")}
            <input
              maxLength={100}
              name="project-title"
              onChange={(event) => updateText("title", event.target.value)}
              value={text.title}
              required
            />
          </label>
          <label>
            {t("category")}
            <select
              name="project-kind"
              onChange={(event) =>
                update("kind", event.target.value as Project["kind"])
              }
              value={form.kind}
            >
              {Object.entries(projectCategories).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t("summary")}
          <textarea
            name="project-summary"
            onChange={(event) => updateText("summary", event.target.value)}
            rows={2}
            value={text.summary}
          />
        </label>
        <label>
          {t("background")}
          <textarea
            name="project-background"
            onChange={(event) => updateText("background", event.target.value)}
            rows={3}
            value={text.background}
          />
        </label>
        <label>
          {t("contribution")}
          <textarea
            name="project-contribution"
            onChange={(event) => updateText("contribution", event.target.value)}
            rows={3}
            value={text.contribution}
          />
        </label>
        <label>
          {t("detail")}
          <textarea
            name="project-detail"
            onChange={(event) => updateText("detail", event.target.value)}
            rows={4}
            value={text.detail}
          />
        </label>
        <div className="hyc-form-grid">
          <label>
            {t("repository")}
            <input
              name="project-repository"
              onChange={(event) => update("repository", event.target.value)}
              type="url"
              value={form.repository}
            />
          </label>
          <label>
            {t("website")}
            <input
              name="project-website"
              onChange={(event) => update("website", event.target.value)}
              type="url"
              value={form.website}
            />
          </label>
          <label>
            {t("stack")}
            <input
              name="project-stack"
              onChange={(event) =>
                update(
                  "technology",
                  event.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                )
              }
              value={form.technology.join(", ")}
            />
          </label>
          <label>
            {t("order")}
            <input
              max={10000}
              min={0}
              name="project-order"
              onChange={(event) => update("order", Number(event.target.value))}
              type="number"
              value={form.order}
            />
          </label>
        </div>
        <label>
          {t("video")}
          <input
            name="project-video"
            onChange={(event) => update("video", event.target.value)}
            type="url"
            value={form.video}
          />
        </label>
        <label className="hyc-upload">
          <Icon name="upload" />
          {t("upload")}
          <small>{t("imageHint")}</small>
          <input
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            name="project-cover"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              act(async () => {
                if (file.size > 3000000) throw new Error("IMAGE_TOO_LARGE");
                const current = dirty ? await save() : form;
                const bytes = new Uint8Array(await file.arrayBuffer());
                let binary = "";
                for (const byte of bytes) binary += String.fromCodePoint(byte);
                const updated = await request<Project>(
                  `/api/admin/projects/${item.id}/image`,
                  {
                    body: JSON.stringify({
                      base64: btoa(binary),
                      version: current.version,
                    }),
                    method: "POST",
                  }
                );
                setForm(updated);
                onChange();
                setNotice(t("uploaded"));
              });
            }}
            type="file"
          />
          {form.imageUrl && <img alt="" src={form.imageUrl} />}
        </label>
        <label>
          {t("note")}
          <textarea
            name="project-private-note"
            onChange={(event) => update("privateNote", event.target.value)}
            rows={2}
            value={form.privateNote || ""}
          />
        </label>
        <div className="hyc-editor-actions">
          <button className="hyc-primary" disabled={busy} type="submit">
            <Icon name="check" size={17} />
            {t("save")}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              if (dirty) {
                setErrorMessage(t("publishDirty"));
                return;
              }
              act(async () => {
                setForm(
                  await request<Project>(
                    `/api/admin/projects/${item.id}/publish`,
                    {
                      body: JSON.stringify({ version: form.version }),
                      method: "POST",
                    }
                  )
                );
                onChange();
                setNotice(t("publishedNotice"));
              });
            }}
            type="button"
          >
            {t("publish")}
          </button>
          {form.published && (
            <button
              className="hyc-danger"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  setForm(
                    await request<Project>(
                      `/api/admin/projects/${item.id}/unpublish`,
                      {
                        body: JSON.stringify({ version: form.version }),
                        method: "POST",
                      }
                    )
                  );
                  onChange();
                  setNotice(t("unpublishedNotice"));
                })
              }
              type="button"
            >
              {t("unpublish")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const Card = ({
  admin,
  go,
  item,
  locale,
  t,
}: {
  admin: boolean;
  go: (route: string) => void;
  item: Project;
  locale: Locale;
  t: ReturnType<typeof usePersonalOS>["t"];
}): React.ReactNode => {
  const text = projectText(item, locale);
  return (
    <a
      className="hyc-project-card"
      href={`/?app=Portfolio&project=${item.id}`}
      onClick={(event) => {
        event.preventDefault();
        go(`project/${item.id}`);
      }}
    >
      <Cover item={item} />
      <div className="hyc-card-body">
        <div className="hyc-card-kicker">
          <span>{t(projectCategories[item.kind])}</span>
          {admin && (
            <span
              className={`hyc-status-chip ${item.published ? "" : "hyc-is-dirty"}`}
            >
              {item.published ? t("published") : t("draft")}
            </span>
          )}
        </div>
        <h3>
          {text.title}
          <Icon name="arrow" size={19} />
        </h3>
        <p>{text.summary || t("draft")}</p>
        <div className="hyc-tags">
          {item.technology.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </a>
  );
};

const Portfolio = ({ id }: ComponentProcessProps): React.ReactNode => {
  const { errorText, locale, navigate, request, route, session, t } =
    usePersonalOS();
  const { title: setTitle } = useProcessesActions();
  const [errorMessage, setErrorMessage] = useState("");
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>();
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<"" | Project["kind"]>("");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const admin = session.role === "admin";
  const selected = route.startsWith("project/")
    ? items.find((item) => item.id === route.slice(8))
    : undefined;
  useEffect(() => {
    setTitle(id, t("portfolio"));
  }, [id, setTitle, t]);
  useEffect(() => {
    let valid = true;
    // eslint-disable-next-line react/set-state-in-effect -- Reset request state when the account or retry generation changes.
    setErrorMessage("");
    setLoading(true);
    Promise.all([
      request<Project[]>(admin ? "/api/admin/projects" : "/api/projects"),
      request<Profile>("/api/profile"),
    ])
      .then(([projects, person]) => {
        if (valid) {
          setItems(projects);
          setProfile(person);
        }
      })
      .catch((error) => {
        if (valid) setErrorMessage(errorText(error));
      })
      .finally(() => {
        if (valid) setLoading(false);
      });
    return () => {
      valid = false;
    };
    // eslint-disable-next-line react/exhaustive-effect-dependencies -- revision is the explicit user-triggered refetch generation.
  }, [admin, revision, request, errorText]);
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Losing the author session closes the editor.
    if (!admin) setEditing(false);
  }, [admin]);
  const go = (next: string): void => {
    if (editing && !confirm(t("leaveConfirm"))) return;
    setEditing(false);
    navigate(next);
  };
  const active = route.startsWith("project/") ? "projects" : route;
  const featured = items.filter((item) => item.featured === true);
  const visible = items.filter(
    (item) =>
      (!filter || item.kind === filter) &&
      [
        projectText(item, locale).title,
        projectText(item, locale).summary,
        ...item.technology,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const create = async (): Promise<void> => {
    try {
      const item = await request<Project>("/api/admin/projects", {
        body: "{}",
        method: "POST",
      });
      setItems((current) => [...current, item]);
      navigate(`project/${item.id}`);
      setEditing(true);
    } catch (error) {
      setErrorMessage(errorText(error));
    }
  };
  return (
    <Surface aria-label={t("portfolio")} className="hyc-portfolio hyc-surface">
      <StyledNavigation as="header" className="hyc-toolbar">
        <Button
          aria-label={t("back")}
          disabled={route === "overview" && !editing}
          onClick={() =>
            go(route.startsWith("project/") ? "projects" : "overview")
          }
        >
          <Back />
        </Button>
        <StyledAddressBar className="hyc-address">
          <Icon name="grid" size={16} />
          <span>
            {t("portfolio")}
            <span className="hyc-path-separator">›</span>
            {selected
              ? projectText(selected, locale).title
              : t(
                  active === "about"
                    ? "about"
                    : active === "projects"
                      ? "projects"
                      : "overview"
                )}
          </span>
        </StyledAddressBar>
      </StyledNavigation>
      <aside className="hyc-sidebar">
        <nav aria-label={t("portfolio")}>
          {(
            [
              ["overview", "grid"],
              ["projects", "code"],
              ["about", "user"],
            ] as const
          ).map(([view, icon]) => (
            <button
              key={view}
              aria-current={active === view ? "page" : undefined}
              onClick={() => go(view)}
              type="button"
            >
              <Icon name={icon} />
              <span>{t(view)}</span>
              {view === "projects" && <small>{items.length}</small>}
            </button>
          ))}
        </nav>
      </aside>
      <div className="hyc-workspace">
        <main key={editing ? "editing" : route} className="hyc-main">
          {errorMessage ? (
            <div className="hyc-empty" role="alert">
              <Icon name="globe" size={38} />
              <h2>{t("offline")}</h2>
              <p>{errorMessage}</p>
              <button onClick={() => setRevision((x) => x + 1)} type="button">
                {t("retry")}
              </button>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="hyc-skeleton" role="status">
              <div />
              <div />
              <div />
              <span>{t("loading")}</span>
            </div>
          ) : editing && selected && admin ? (
            <Editor
              key={selected.id}
              item={selected}
              onChange={() => setRevision((x) => x + 1)}
              onClose={() => setEditing(false)}
              processId={id}
            />
          ) : route.startsWith("project/") ? (
            selected ? (
              <article className="hyc-detail">
                <div className="hyc-heading-line">
                  <button
                    className="hyc-text-button"
                    onClick={() => go("projects")}
                    type="button"
                  >
                    <Icon name="back" size={16} />
                    {t("back")}
                  </button>
                  {admin && (
                    <button onClick={() => setEditing(true)} type="button">
                      <Icon name="edit" size={16} />
                      {t("edit")}
                    </button>
                  )}
                </div>
                <Cover item={selected} large />
                <div className="hyc-detail-heading">
                  <div>
                    <span className="hyc-eyebrow">
                      {t(projectCategories[selected.kind])}
                    </span>
                    <h1>{projectText(selected, locale).title}</h1>
                    <p className="hyc-detail-summary">
                      {projectText(selected, locale).summary}
                    </p>
                  </div>
                </div>
                <div className="hyc-actions">
                  {selected.repository && (
                    <a
                      className="hyc-primary"
                      href={selected.repository}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Icon name="code" size={18} />
                      {t("source")}
                    </a>
                  )}
                  {selected.website && (
                    <a
                      href={selected.website}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Icon name="link" size={17} />
                      {t("visit")}
                    </a>
                  )}
                </div>
                <div className="hyc-detail-columns">
                  <div>
                    {(["background", "contribution", "detail"] as const).map(
                      (field) =>
                        projectText(selected, locale)[field] && (
                          <section key={field}>
                            <h2>{t(field)}</h2>
                            <p>{projectText(selected, locale)[field]}</p>
                          </section>
                        )
                    )}
                    {selected.video && (
                      <section>
                        <h2>{t("media")}</h2>
                        <a
                          href={selected.video}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Icon name="play" size={18} />
                          {t("video")}
                        </a>
                      </section>
                    )}
                  </div>
                  <aside>
                    <h2>{t("stack")}</h2>
                    <div className="hyc-tags">
                      {selected.technology.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <p className="hyc-source-note">
                      Open source
                      <br />
                      GitHub
                    </p>
                  </aside>
                </div>
              </article>
            ) : (
              <div className="hyc-empty">
                <Icon name="code" size={40} />
                <h2>{t("missing")}</h2>
                <p>{t("missingHint")}</p>
                <button onClick={() => go("projects")} type="button">
                  {t("back")}
                </button>
              </div>
            )
          ) : active === "about" ? (
            <article className="hyc-about">
              <div className="hyc-about-avatar">
                YH
                <span />
              </div>
              <h1>{profile?.name}</h1>
              <p className="hyc-about-lead">{profile?.bio[locale]}</p>
              <div className="hyc-about-grid">
                <section>
                  <Icon name="book" />
                  <h2>{t("education")}</h2>
                  <p>{profile?.education[locale]}</p>
                </section>
                <section>
                  <Icon name="spark" />
                  <h2>AI Efficiency</h2>
                  <p>{t("aboutHint")}</p>
                </section>
              </div>
              <section className="hyc-about-stack">
                <h2>{t("stack")}</h2>
                <p className="hyc-muted">{t("skillHint")}</p>
                <div className="hyc-tags">
                  {[...new Set(items.flatMap((item) => item.technology))].map(
                    (tag) => (
                      <span key={tag}>{tag}</span>
                    )
                  )}
                </div>
              </section>
              <section className="hyc-contact">
                <div>
                  <h2>{t("contact")}</h2>
                  <p>{profile?.email}</p>
                </div>
                <div className="hyc-actions">
                  <a className="hyc-primary" href={`mailto:${profile?.email}`}>
                    <Icon name="mail" size={17} />
                    {t("email")}
                  </a>
                  <a
                    href={profile?.github}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon name="code" size={17} />
                    GitHub
                  </a>
                </div>
              </section>
            </article>
          ) : (
            <>
              {active === "overview" && (
                <section className="hyc-hero">
                  <img alt="" src="/System/PersonalOS/portfolio.svg" />
                  <div>
                    <h1>{profile?.name}</h1>
                    <p>{profile?.bio[locale]}</p>
                    <div className="hyc-actions">
                      <button onClick={() => go("projects")} type="button">
                        {t("browse")}
                      </button>
                      <a
                        href={profile?.github}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Icon name="code" size={16} />
                        GitHub
                      </a>
                    </div>
                  </div>
                </section>
              )}
              <section className="hyc-collection">
                <div className="hyc-heading-line">
                  <div>
                    <h2>
                      {active === "overview" ? t("collection") : t("projects")}
                      <span className="hyc-count">
                        {(active === "overview"
                          ? featured.length
                          : items.length
                        )
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </h2>
                  </div>
                  {admin ? (
                    <button
                      className="hyc-primary"
                      onClick={() => create()}
                      type="button"
                    >
                      <Icon name="plus" size={16} />
                      {t("newProject")}
                    </button>
                  ) : (
                    active === "overview" && (
                      <button
                        className="hyc-text-button"
                        onClick={() => go("projects")}
                        type="button"
                      >
                        {t("viewAll")}
                        <Icon name="arrow" size={16} />
                      </button>
                    )
                  )}
                </div>
                {active === "projects" && (
                  <div className="hyc-filterbar">
                    <div className="hyc-segments">
                      {Object.entries(projectCategories).map(
                        ([value, label]) => (
                          <button
                            key={value}
                            aria-pressed={filter === value}
                            onClick={() =>
                              setFilter((current) =>
                                current === value
                                  ? ""
                                  : (value as Project["kind"])
                              )
                            }
                            type="button"
                          >
                            {t(label)}
                          </button>
                        )
                      )}
                    </div>
                    <label className="hyc-search">
                      <Icon name="search" size={17} />
                      <input
                        aria-label={t("search")}
                        name="project-search"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t("search")}
                        value={search}
                      />
                    </label>
                  </div>
                )}
                <div className="hyc-project-grid">
                  {(active === "overview" ? featured : visible).map((item) => (
                    <Card
                      key={item.id}
                      admin={admin}
                      go={go}
                      item={item}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
                {active === "projects" && visible.length === 0 && (
                  <div className="hyc-empty">
                    <Icon name="search" size={32} />
                    <h2>{t("empty")}</h2>
                    <p>{t("emptyHint")}</p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilter("");
                      }}
                      type="button"
                    >
                      {t("all")}
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
      <StyledStatusBar className="hyc-statusbar">
        <span>
          {items.length} {t("projects")}
        </span>
        <span>{profile?.name}</span>
        {admin && (
          <span className="hyc-admin-chip">
            <Icon name="lock" size={12} />
            {t("admin")}
          </span>
        )}
      </StyledStatusBar>
    </Surface>
  );
};

export default Portfolio;
