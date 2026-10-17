// Local research model: no executable manifest fields, remote fetch or server writes.
export type WebApp = {
  description: string;
  enabled: boolean;
  id: string;
  name: string;
  nameEn: string;
  url: string;
};
export type Library = { apps: WebApp[]; favorites: string[]; version: 1 };
export const STORAGE_KEY = "hyc.app-library.v1";
export const emptyLibrary = (): Library => ({
  apps: [],
  favorites: [],
  version: 1,
});

export const externalURL = (input: string, siteOrigin: string): string => {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.origin === siteOrigin ||
    host === new URL(siteOrigin).hostname ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    !host.includes(".") ||
    /^\d+(?:\.\d+){3}$/.test(host) ||
    host.includes(":")
  ) {
    throw new Error("INVALID_URL");
  }
  return url.href;
};

const shortText = (value: unknown, max: number, required = false): string => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  ) {
    throw new Error("INVALID_MANIFEST");
  }
  return value.trim();
};

export const parseManifest = (
  input: unknown,
  siteOrigin: string
): Omit<WebApp, "enabled" | "id"> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("INVALID_MANIFEST");
  }
  const data = input as Record<string, unknown>;
  if (
    Object.keys(data).some(
      (key) => !["description", "name", "nameEn", "url"].includes(key)
    )
  ) {
    throw new Error("INVALID_MANIFEST");
  }
  return {
    description: shortText(data.description ?? "", 500),
    name: shortText(data.name, 80, true),
    nameEn: shortText(data.nameEn ?? data.name, 80, true),
    url: externalURL(shortText(data.url, 2048, true), siteOrigin),
  };
};

export const readLibrary = (
  raw: null | string,
  siteOrigin: string
): Library => {
  if (!raw) return emptyLibrary();
  if (raw.length > 300000) throw new Error("INVALID_LIBRARY");
  const value = JSON.parse(raw) as Library;
  if (
    value?.version !== 1 ||
    !Array.isArray(value.favorites) ||
    value.favorites.length > 100 ||
    !value.favorites.every((id) => typeof id === "string" && id.length < 100) ||
    !Array.isArray(value.apps) ||
    value.apps.length > 100
  ) {
    throw new Error("INVALID_LIBRARY");
  }
  const ids = new Set<string>();
  const urls = new Set<string>();
  const apps = value.apps.map((app) => {
    if (
      !app ||
      typeof app.id !== "string" ||
      !/^web-[a-f0-9-]{36}$/.test(app.id) ||
      ids.has(app.id) ||
      typeof app.enabled !== "boolean"
    ) {
      throw new Error("INVALID_LIBRARY");
    }
    const parsed = parseManifest(
      {
        description: app.description,
        name: app.name,
        nameEn: app.nameEn,
        url: app.url,
      },
      siteOrigin
    );
    if (urls.has(parsed.url)) throw new Error("INVALID_LIBRARY");
    ids.add(app.id);
    urls.add(parsed.url);
    return { ...parsed, enabled: app.enabled, id: app.id };
  });
  return { apps, favorites: [...new Set(value.favorites)], version: 1 };
};
