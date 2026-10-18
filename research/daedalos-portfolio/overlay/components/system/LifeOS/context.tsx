import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "zh" | "en";
export type ProjectText = { title: string; summary: string; background: string; contribution: string; detail: string };
export type Project = { id: string; kind: "project" | "contribution"; order: number; accent: string; technology: string[]; repository: string; website: string; video: string; translations: Record<Locale, ProjectText>; imageUrl?: string; privateNote?: string; published?: boolean; version?: number };
export type Profile = { name: string; headline: Record<Locale, string>; bio: Record<Locale, string>; email: string; github: string; education: Record<Locale, string> };
export const messages = {
  zh: { portfolio: "个人作品集", settings: "系统设置", overview: "概览", projects: "作品", about: "关于我", openSource: "开源项目", contributed: "参与贡献", all: "全部作品", search: "搜索作品或技术", source: "查看源码", visit: "访问项目", back: "返回作品", background: "项目背景", contribution: "我的贡献", detail: "项目介绍", stack: "技术与方向", contact: "联系我", education: "学习经历", profile: "个人简介", loading: "正在加载…", retry: "重试", empty: "没有找到匹配的作品", emptyHint: "试试其他关键词，或查看全部作品。", missing: "作品不存在或尚未公开", missingHint: "这项作品可能已下架，也可能尚未发布。", collection: "精选作品", collectionHint: "从项目背景到开源实现，每项作品都有自己的起点。", myProjects: "我的项目", contributions: "开源贡献", browse: "浏览作品", language: "语言与地区", automatic: "跟随浏览器", manageSection: "站点维护", management: "内容管理", key: "管理员密钥", enter: "进入管理", logout: "退出管理", admin: "管理模式", newProject: "新建作品", edit: "编辑作品", preview: "预览", save: "保存草稿", publish: "发布已保存版本", unpublish: "下架", published: "已发布", draft: "草稿", title: "作品名称", summary: "简短介绍", note: "私有备注", order: "展示排序", category: "作品归属", upload: "上传封面", saved: "草稿已保存，公开版本未改变", publishedNotice: "已发布，访客现在可以查看", unpublishedNotice: "已下架，公开访问已关闭", uploaded: "封面已保存到草稿", unsaved: "尚有未保存修改", leaveConfirm: "有未保存的修改，确定离开吗？", publishDirty: "请先保存修改，再发布。", minimize: "最小化", maximize: "最大化", close: "关闭", preferenceHint: "语言选择会保存在此浏览器，切换不会改变日程的时区。", privateHint: "此处仅用于作者维护，访客无需登录。", aboutHint: "在开源实践中，把关注的问题变成可阅读、可使用的作品。", languages: "中英双语", viewAll: "查看全部", media: "项目媒体", video: "视频链接", website: "项目网站", repository: "源码链接", offline: "暂时无法连接内容服务", error: "操作未完成，请重试", imageHint: "PNG、JPEG 或 WebP，最大 3 MB", updated: "内容更新", restore: "打开", draftExplanation: "保存只更新草稿；发布后访客才会看到。", fallback: "当前显示原文", skillHint: "根据项目公开技术栈整理", email: "发送邮件", timezone: "当前时区", keyError: "密钥无效", conflict: "内容已被更新，请重新打开后编辑", limit: "尝试过于频繁，请稍后再试", incomplete: "发布前请填写中英标题、简介和源码链接", invalidImage: "图片格式不受支持或大小超限", see: "查看详情", author: "Yincan Huang", },
  en: { portfolio: "Portfolio", settings: "System settings", overview: "Overview", projects: "Projects", about: "About", openSource: "Open source", contributed: "Contributions", all: "All work", search: "Search projects or technology", source: "View source", visit: "Open project", back: "Back to projects", background: "Background", contribution: "My contribution", detail: "About this project", stack: "Tools & interests", contact: "Get in touch", education: "Education", profile: "About me", loading: "Loading…", retry: "Try again", empty: "No matching projects", emptyHint: "Try another keyword, or explore all work.", missing: "This project is not available", missingHint: "It may be unpublished or no longer shared.", collection: "Selected work", collectionHint: "From the first question to the open-source implementation.", myProjects: "My projects", contributions: "Open-source contributions", browse: "Explore work", language: "Language & region", automatic: "Follow browser", manageSection: "Site maintenance", management: "Manage content", key: "Administrator key", enter: "Enter management", logout: "Sign out", admin: "Management", newProject: "New project", edit: "Edit project", preview: "Preview", save: "Save draft", publish: "Publish saved version", unpublish: "Unpublish", published: "Published", draft: "Draft", title: "Project name", summary: "Short description", note: "Private note", order: "Display order", category: "Project relationship", upload: "Upload cover", saved: "Draft saved. The public version is unchanged.", publishedNotice: "Published. Visitors can now view it.", unpublishedNotice: "Unpublished. Public access is closed.", uploaded: "Cover saved to draft", unsaved: "Unsaved changes", leaveConfirm: "You have unsaved changes. Leave this page?", publishDirty: "Save your changes before publishing.", minimize: "Minimize", maximize: "Maximize", close: "Close", preferenceHint: "Your language preference stays in this browser. Language changes do not alter schedule time zones.", privateHint: "For site maintenance. Visitors do not need to sign in.", aboutHint: "Turning questions into open-source work that others can read, use and build on.", languages: "Chinese & English", viewAll: "View all", media: "Project media", video: "Video URL", website: "Project website", repository: "Source URL", offline: "The content service is currently unavailable", error: "Something went wrong. Please try again.", imageHint: "PNG, JPEG or WebP, up to 3 MB", updated: "Content updated", restore: "Open", draftExplanation: "Saving changes the draft. Publishing makes it visible to visitors.", fallback: "Showing original text", skillHint: "Based on public project technology", email: "Send email", timezone: "Current time zone", keyError: "Invalid key", conflict: "This content changed. Reopen it before editing.", limit: "Too many attempts. Please try again later.", incomplete: "Add both titles, descriptions and a source link before publishing", invalidImage: "Unsupported image or file too large", see: "View project", author: "Yincan Huang", },
};
export type Message = keyof typeof messages.zh;
type Session = { role: "visitor" | "admin"; csrf: string | null };
type Settings = { language: "auto" | Locale };
type LifeOSContext = { locale: Locale; t: (key: Message) => string; preferences: Settings; setPreference: <K extends keyof Settings>(key: K, value: Settings[K]) => void; session: Session; applySession: (s: Session) => void; request: <T = any>(path: string, options?: RequestInit) => Promise<T>; route: string; navigate: (route: string) => void; errorText: (error: unknown) => string };
const Context = createContext<LifeOSContext | null>(null);
const getRoute = (): string => new URLSearchParams(location.search).get("project") ? `project/${new URLSearchParams(location.search).get("project")}` : new URLSearchParams(location.search).get("view") || "overview";
export const useLifeOS = (): LifeOSContext => { const value = useContext(Context); if (!value) throw new Error("LifeOS context missing"); return value; };

export const LifeOSProvider: FC = ({ children }) => {
  const [preferences, setPreferences] = useState<Settings>({ language: "auto" });
  const [browserLocale, setBrowserLocale] = useState<Locale>("en");
  const [session, applySession] = useState<Session>({ role: "visitor", csrf: null });
  const [route, setRoute] = useState("overview");
  useEffect(() => {
    // Preserve the language choice, discard retired concept-only shell/style preferences.
    try {
      const saved = JSON.parse(localStorage.getItem("hyc.preferences.v1") || "{}");
      const language = ["auto", "zh", "en"].includes(saved.language) ? saved.language : "auto";
      setPreferences({ language });
      localStorage.setItem("hyc.preferences.v1", JSON.stringify({ language }));
    } catch { /* Browser storage may be unavailable. */ }
    delete document.documentElement.dataset.hycMode;
    delete document.documentElement.dataset.hycTheme;
    const updateLocale = (): void => { for (const language of navigator.languages) { if (language.startsWith("zh")) { setBrowserLocale("zh"); return; } if (language.startsWith("en")) { setBrowserLocale("en"); return; } } setBrowserLocale("en"); };
    const updateRoute = (): void => setRoute(getRoute());
    updateLocale(); updateRoute(); addEventListener("popstate", updateRoute); addEventListener("languagechange", updateLocale);
    fetch("/api/session").then(response => response.json()).then(applySession).catch(() => {});
    return () => { removeEventListener("popstate", updateRoute); removeEventListener("languagechange", updateLocale); };
  }, []);
  const locale = preferences.language === "auto" ? browserLocale : preferences.language;
  useEffect(() => { document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"; }, [locale]);
  const setPreference: LifeOSContext["setPreference"] = (key, value) => setPreferences(current => { const next = { ...current, [key]: value }; try { localStorage.setItem("hyc.preferences.v1", JSON.stringify(next)); } catch {} return next; });
  const request: LifeOSContext["request"] = async (path, options = {}) => {
    const response = await fetch(path, { credentials: "same-origin", ...options, headers: { "Content-Type": "application/json", ...(session.csrf ? { "X-CSRF-Token": session.csrf } : {}), ...options.headers } });
    const result = await response.json(); if (!response.ok) { if (response.status === 401 && session.role === "admin") applySession({ role: "visitor", csrf: null }); throw new Error(result.error || "REQUEST_FAILED"); } return result;
  };
  const navigate = (next: string): void => { const url = new URL(location.href); url.searchParams.set("app", "Portfolio"); url.searchParams.delete("project"); url.searchParams.delete("view"); if (next.startsWith("project/")) url.searchParams.set("project", next.slice(8)); else if (next !== "overview") url.searchParams.set("view", next); if (url.href !== location.href) history.pushState({}, "", url); setRoute(next); };
  const t = (key: Message): string => messages[locale]?.[key] || messages.en[key];
  const errorText = (error: unknown): string => {
    const code = error instanceof Error ? error.message : "";
    const map: Record<string, Message> = { INVALID_KEY: "keyError", VERSION_CONFLICT: "conflict", TRY_LATER: "limit", PUBLICATION_INCOMPLETE: "incomplete", INVALID_IMAGE: "invalidImage", IMAGE_TOO_LARGE: "invalidImage", AUTH_REQUIRED: "keyError" };
    return t(map[code] || "error");
  };
  return <Context.Provider value={{ locale, t, preferences, setPreference, session, applySession, request, route, navigate, errorText }}>{children}</Context.Provider>;
};
