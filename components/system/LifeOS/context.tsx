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
} from "components/system/LifeOS/deployment";

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
  repository: string;
  technology: string[];
  translations: Record<Locale, ProjectText>;
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
    all: "All work",
    author: "Yincan Huang",
    automatic: "Follow browser",
    back: "Back to projects",
    background: "Background",
    browse: "Explore work",
    close: "Close",
    collection: "Selected work",
    collectionHint:
      "From the first question to the open-source implementation.",
    contact: "Get in touch",
    contributed: "Contributions",
    contribution: "My contribution",
    contributions: "Open-source contributions",
    detail: "About this project",
    education: "Education",
    email: "Send email",
    empty: "No matching projects",
    emptyHint: "Try another keyword, or explore all work.",
    error: "Something went wrong. Please try again.",
    fallback: "Showing original text",
    language: "Language & region",
    languages: "Chinese & English",
    loading: "Loading…",
    maximize: "Maximize",
    media: "Project media",
    minimize: "Minimize",
    missing: "This project is not available",
    missingHint: "This project could not be found. Explore the other work.",
    offline: "The content service is currently unavailable",
    openSource: "Open source",
    other: "Other",
    overview: "Overview",
    portfolio: "Portfolio",
    preferenceHint:
      "Your language preference stays in this browser. Language changes do not alter schedule time zones.",
    products: "Products",
    profile: "About me",
    projects: "Projects",
    restore: "Open",
    retry: "Try again",
    search: "Search projects or technology",
    see: "View project",
    settings: "System settings",
    skillHint: "Based on public project technology",
    source: "View source",
    stack: "Tools & interests",
    timezone: "Current time zone",
    tools: "Tools",
    updated: "Content updated",
    video: "Video URL",
    viewAll: "View all",
    visit: "Open project",
  },
  zh: {
    about: "关于我",
    aboutHint: "在开源实践中，把关注的问题变成可阅读、可使用的作品。",
    all: "全部作品",
    author: "Yincan Huang",
    automatic: "跟随浏览器",
    back: "返回作品",
    background: "项目背景",
    browse: "浏览作品",
    close: "关闭",
    collection: "精选作品",
    collectionHint: "从项目背景到开源实现，每项作品都有自己的起点。",
    contact: "联系我",
    contributed: "贡献",
    contribution: "我的贡献",
    contributions: "开源贡献",
    detail: "项目介绍",
    education: "学习经历",
    email: "发送邮件",
    empty: "没有找到匹配的作品",
    emptyHint: "试试其他关键词，或查看全部作品。",
    error: "操作未完成，请重试",
    fallback: "当前显示原文",
    language: "语言与地区",
    languages: "中英双语",
    loading: "正在加载…",
    maximize: "最大化",
    media: "项目媒体",
    minimize: "最小化",
    missing: "找不到此作品",
    missingHint: "暂时无法找到这项作品，可以查看其他作品。",
    offline: "暂时无法连接内容服务",
    openSource: "开源项目",
    other: "其他",
    overview: "概览",
    portfolio: "个人作品集",
    preferenceHint: "语言选择会保存在此浏览器，切换不会改变日程的时区。",
    products: "产品",
    profile: "个人简介",
    projects: "作品",
    restore: "打开",
    retry: "重试",
    search: "搜索作品或技术",
    see: "查看详情",
    settings: "系统设置",
    skillHint: "根据项目公开技术栈整理",
    source: "查看源码",
    stack: "技术与方向",
    timezone: "当前时区",
    tools: "工具",
    updated: "内容更新",
    video: "视频链接",
    viewAll: "查看全部",
    visit: "访问项目",
  },
};
export type Message = keyof typeof messages.zh;
type Settings = { language: "auto" | Locale };
type LifeOSContext = {
  errorText: (error: unknown) => string;
  locale: Locale;
  navigate: (route: string) => void;
  preferences: Settings;
  request: <T = unknown>(path: string) => Promise<T>;
  route: string;
  setPreference: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  t: (key: Message) => string;
};
const Context = createContext<LifeOSContext | undefined>(undefined);
const getRoute = (): string =>
  new URLSearchParams(location.search).get("project")
    ? `project/${new URLSearchParams(location.search).get("project")}`
    : new URLSearchParams(location.search).get("view") || "overview";
export const useLifeOS = (): LifeOSContext => {
  const value = useContext(Context);
  if (!value) throw new Error("LifeOS context missing");
  return value;
};

export const LifeOSProvider: FC = ({ children }) => {
  const [preferences, setPreferences] = useState<Settings>({
    language: "auto",
  });
  const [browserLocale, setBrowserLocale] = useState<Locale>("en");
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
  const setPreference: LifeOSContext["setPreference"] = (key, value) =>
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      try {
        localStorage.setItem("hyc.preferences.v1", JSON.stringify(next));
      } catch {
        /* Keep preferences in memory when storage is unavailable. */
      }
      return next;
    });
  const request = useCallback(async <T,>(path: string): Promise<T> => {
    const response = await fetch(
      STATIC_CONTENT ? publicContentPath(path) : path,
      {
        credentials: "omit",
        method: "GET",
      }
    );
    const result: unknown = await response.json();
    if (!response.ok) {
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
  }, []);
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
  const errorText = useCallback((): string => t("error"), [t]);
  return (
    <Context.Provider
      value={{
        errorText,
        locale,
        navigate,
        preferences,
        request,
        route,
        setPreference,
        t,
      }}
    >
      {children}
    </Context.Provider>
  );
};
