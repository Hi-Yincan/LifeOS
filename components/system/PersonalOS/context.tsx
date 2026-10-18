import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  publicContentPath,
  STATIC_CONTENT,
} from "components/system/PersonalOS/deployment";

export type Locale = "en" | "zh";
export type ProjectText = {
  background: string;
  contribution: string;
  detail: string;
  summary: string;
  title: string;
};
export type Project = {
  accent: string;
  featured?: boolean;
  id: string;
  imageUrl?: string;
  kind: "contribution" | "other" | "project" | "tool";
  order: number;
  privateNote?: string;
  published?: boolean;
  repository: string;
  technology: string[];
  translations: Record<Locale, ProjectText>;
  version?: number;
  video: string;
  website: string;
};
export type Profile = {
  bio: Record<Locale, string>;
  education: Record<Locale, string>;
  email: string;
  github: string;
  headline: Record<Locale, string>;
  name: string;
};
export const messages = {
  en: {
    about: "About",
    aboutHint:
      "Turning questions into open-source work that others can read, use and build on.",
    admin: "Management",
    all: "All work",
    author: "Yincan Huang",
    automatic: "Follow browser",
    back: "Back to projects",
    background: "Background",
    browse: "Explore work",
    category: "Project category",
    close: "Close",
    collection: "Selected work",
    collectionHint:
      "From the first question to the open-source implementation.",
    conflict: "This content changed. Reopen it before editing.",
    contact: "Get in touch",
    contributed: "Contributions",
    contribution: "My contribution",
    contributions: "Open-source contributions",
    detail: "About this project",
    draft: "Draft",
    draftExplanation:
      "Saving changes the draft. Publishing makes it visible to visitors.",
    edit: "Edit project",
    education: "Education",
    email: "Send email",
    empty: "No matching projects",
    emptyHint: "Try another keyword, or explore all work.",
    enter: "Enter management",
    error: "Something went wrong. Please try again.",
    fallback: "Showing original text",
    imageHint: "PNG, JPEG or WebP, up to 3 MB",
    incomplete:
      "Add both titles, descriptions and a source link before publishing",
    invalidImage: "Unsupported image or file too large",
    key: "Administrator key",
    keyError: "Invalid key",
    language: "Language & region",
    languages: "Chinese & English",
    leaveConfirm: "You have unsaved changes. Leave this page?",
    limit: "Too many attempts. Please try again later.",
    loading: "Loading…",
    logout: "Sign out",
    management: "Manage content",
    manageSection: "Site maintenance",
    maximize: "Maximize",
    media: "Project media",
    minimize: "Minimize",
    missing: "This project is not available",
    missingHint: "It may be unpublished or no longer shared.",
    newProject: "New project",
    note: "Private note",
    offline: "The content service is currently unavailable",
    openSource: "Open source",
    order: "Display order",
    other: "Other",
    overview: "Overview",
    portfolio: "Portfolio",
    preferenceHint:
      "Your language preference stays in this browser. Language changes do not alter schedule time zones.",
    preview: "Preview",
    privateHint: "For site maintenance. Visitors do not need to sign in.",
    products: "Products",
    profile: "About me",
    projects: "Projects",
    publish: "Publish saved version",
    publishDirty: "Save your changes before publishing.",
    published: "Published",
    publishedNotice: "Published. Visitors can now view it.",
    readOnly: "Online content management is not available yet.",
    repository: "Source URL",
    restore: "Open",
    retry: "Try again",
    save: "Save draft",
    saved: "Draft saved. The public version is unchanged.",
    search: "Search projects or technology",
    see: "View project",
    settings: "System settings",
    skillHint: "Based on public project technology",
    source: "View source",
    stack: "Tools & interests",
    summary: "Short description",
    timezone: "Current time zone",
    title: "Project name",
    tools: "Tools",
    unpublish: "Unpublish",
    unpublishedNotice: "Unpublished. Public access is closed.",
    unsaved: "Unsaved changes",
    updated: "Content updated",
    upload: "Upload cover",
    uploaded: "Cover saved to draft",
    video: "Video URL",
    viewAll: "View all",
    visit: "Open project",
    website: "Project website",
  },
  zh: {
    about: "关于我",
    aboutHint: "在开源实践中，把关注的问题变成可阅读、可使用的作品。",
    admin: "管理模式",
    all: "全部作品",
    author: "Yincan Huang",
    automatic: "跟随浏览器",
    back: "返回作品",
    background: "项目背景",
    browse: "浏览作品",
    category: "作品分类",
    close: "关闭",
    collection: "精选作品",
    collectionHint: "从项目背景到开源实现，每项作品都有自己的起点。",
    conflict: "内容已被更新，请重新打开后编辑",
    contact: "联系我",
    contributed: "贡献",
    contribution: "我的贡献",
    contributions: "开源贡献",
    detail: "项目介绍",
    draft: "草稿",
    draftExplanation: "保存只更新草稿；发布后访客才会看到。",
    edit: "编辑作品",
    education: "学习经历",
    email: "发送邮件",
    empty: "没有找到匹配的作品",
    emptyHint: "试试其他关键词，或查看全部作品。",
    enter: "进入管理",
    error: "操作未完成，请重试",
    fallback: "当前显示原文",
    imageHint: "PNG、JPEG 或 WebP，最大 3 MB",
    incomplete: "发布前请填写中英标题、简介和源码链接",
    invalidImage: "图片格式不受支持或大小超限",
    key: "管理员密钥",
    keyError: "密钥无效",
    language: "语言与地区",
    languages: "中英双语",
    leaveConfirm: "有未保存的修改，确定离开吗？",
    limit: "尝试过于频繁，请稍后再试",
    loading: "正在加载…",
    logout: "退出管理",
    management: "内容管理",
    manageSection: "站点维护",
    maximize: "最大化",
    media: "项目媒体",
    minimize: "最小化",
    missing: "作品不存在或尚未公开",
    missingHint: "这项作品可能已下架，也可能尚未发布。",
    newProject: "新建作品",
    note: "私有备注",
    offline: "暂时无法连接内容服务",
    openSource: "开源项目",
    order: "展示排序",
    other: "其他",
    overview: "概览",
    portfolio: "个人作品集",
    preferenceHint: "语言选择会保存在此浏览器，切换不会改变日程的时区。",
    preview: "预览",
    privateHint: "此处仅用于作者维护，访客无需登录。",
    products: "产品",
    profile: "个人简介",
    projects: "作品",
    publish: "发布已保存版本",
    publishDirty: "请先保存修改，再发布。",
    published: "已发布",
    publishedNotice: "已发布，访客现在可以查看",
    readOnly: "在线内容管理暂未开放。",
    repository: "源码链接",
    restore: "打开",
    retry: "重试",
    save: "保存草稿",
    saved: "草稿已保存，公开版本未改变",
    search: "搜索作品或技术",
    see: "查看详情",
    settings: "系统设置",
    skillHint: "根据项目公开技术栈整理",
    source: "查看源码",
    stack: "技术与方向",
    summary: "简短介绍",
    timezone: "当前时区",
    title: "作品名称",
    tools: "工具",
    unpublish: "下架",
    unpublishedNotice: "已下架，公开访问已关闭",
    unsaved: "尚有未保存修改",
    updated: "内容更新",
    upload: "上传封面",
    uploaded: "封面已保存到草稿",
    video: "视频链接",
    viewAll: "查看全部",
    visit: "访问项目",
    website: "项目网站",
  },
};
export type Message = keyof typeof messages.zh;
export type Session = { csrf?: null | string; role: "admin" | "visitor" };
type Settings = { language: "auto" | Locale };
type PersonalContext = {
  applySession: (s: Session) => void;
  errorText: (error: unknown) => string;
  locale: Locale;
  navigate: (route: string) => void;
  preferences: Settings;
  request: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
  route: string;
  session: Session;
  setPreference: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  t: (key: Message) => string;
};
const Context = createContext<PersonalContext | undefined>(undefined);
const getRoute = (): string =>
  new URLSearchParams(location.search).get("project")
    ? `project/${new URLSearchParams(location.search).get("project")}`
    : new URLSearchParams(location.search).get("view") || "overview";
export const usePersonalOS = (): PersonalContext => {
  const value = useContext(Context);
  if (!value) throw new Error("Personal OS context missing");
  return value;
};

export const PersonalOSProvider: FC = ({ children }) => {
  const [preferences, setPreferences] = useState<Settings>({
    language: "auto",
  });
  const [browserLocale, setBrowserLocale] = useState<Locale>("en");
  const [session, setSession] = useState<Session>({
    csrf: undefined,
    role: "visitor",
  });
  const applySession = setSession;
  const [route, setRoute] = useState("overview");
  useEffect(() => {
    // Preserve the language choice, discard retired concept-only shell/style preferences.
    try {
      const saved = JSON.parse(
        localStorage.getItem("hyc.preferences.v1") || "{}"
      ) as { language?: unknown } | undefined;
      const value = saved?.language;
      const language =
        value === "auto" || value === "en" || value === "zh" ? value : "auto";
      // eslint-disable-next-line react/set-state-in-effect -- Hydrate browser-only preferences after server rendering.
      setPreferences({ language });
      localStorage.setItem("hyc.preferences.v1", JSON.stringify({ language }));
    } catch {
      /* Browser storage may be unavailable. */
    }
    delete document.documentElement.dataset.hycMode;
    delete document.documentElement.dataset.hycTheme;
    const updateLocale = (): void => {
      for (const language of navigator.languages) {
        if (language.startsWith("zh")) {
          setBrowserLocale("zh");
          return;
        }
        if (language.startsWith("en")) {
          setBrowserLocale("en");
          return;
        }
      }
      setBrowserLocale("en");
    };
    const updateRoute = (): void => setRoute(getRoute());
    updateLocale();
    updateRoute();
    addEventListener("popstate", updateRoute);
    addEventListener("languagechange", updateLocale);
    if (!STATIC_CONTENT) {
      fetch("/api/session")
        .then((response) => response.json())
        .then((value: unknown) => {
          if (
            value &&
            typeof value === "object" &&
            "role" in value &&
            (value.role === "visitor" || value.role === "admin")
          ) {
            const csrf =
              "csrf" in value && typeof value.csrf === "string"
                ? value.csrf
                : undefined;
            applySession({ csrf, role: value.role });
          }
        })
        .catch(() => {
          /* A static-only preview remains in visitor mode. */
        });
    }
    return () => {
      removeEventListener("popstate", updateRoute);
      removeEventListener("languagechange", updateLocale);
    };
  }, []);
  const locale =
    preferences.language === "auto" ? browserLocale : preferences.language;
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
  const setPreference: PersonalContext["setPreference"] = (key, value) =>
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      try {
        localStorage.setItem("hyc.preferences.v1", JSON.stringify(next));
      } catch {
        /* Keep preferences in memory when storage is unavailable. */
      }
      return next;
    });
  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      if (STATIC_CONTENT && (options.method || "GET").toUpperCase() !== "GET") {
        throw new Error("READ_ONLY_DEPLOYMENT");
      }
      const response = await fetch(
        STATIC_CONTENT ? publicContentPath(path) : path,
        {
          credentials: "same-origin",
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(session.csrf ? { "X-CSRF-Token": session.csrf } : {}),
            ...options.headers,
          },
        }
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 401 && session.role === "admin") {
          applySession({ csrf: undefined, role: "visitor" });
        }
        const code =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "REQUEST_FAILED";
        throw new Error(code);
      }
      return result as T;
    },
    [session.csrf, session.role]
  );
  const navigate = (next: string): void => {
    const url = new URL(location.href);
    url.searchParams.set("app", "Portfolio");
    url.searchParams.delete("project");
    url.searchParams.delete("view");
    if (next.startsWith("project/")) {
      url.searchParams.set("project", next.slice(8));
    } else if (next !== "overview") url.searchParams.set("view", next);
    if (url.href !== location.href) history.pushState({}, "", url);
    setRoute(next);
  };
  const t = useCallback(
    (key: Message): string => messages[locale][key],
    [locale]
  );
  const errorText = useCallback(
    (error: unknown): string => {
      const code = error instanceof Error ? error.message : "";
      const map: Record<string, Message> = {
        AUTH_REQUIRED: "keyError",
        IMAGE_TOO_LARGE: "invalidImage",
        INVALID_IMAGE: "invalidImage",
        INVALID_KEY: "keyError",
        PUBLICATION_INCOMPLETE: "incomplete",
        READ_ONLY_DEPLOYMENT: "readOnly",
        TRY_LATER: "limit",
        VERSION_CONFLICT: "conflict",
      };
      return t(map[code] || "error");
    },
    [t]
  );
  return (
    <Context.Provider
      value={{
        applySession,
        errorText,
        locale,
        navigate,
        preferences,
        request,
        route,
        session,
        setPreference,
        t,
      }}
    >
      {children}
    </Context.Provider>
  );
};
