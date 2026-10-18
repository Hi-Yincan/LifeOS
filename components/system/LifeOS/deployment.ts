// 静态版本从公开快照读取内容。
export const STATIC_CONTENT = process.env.NEXT_PUBLIC_CONTENT_MODE === "static";

export const publicContentPath = (path: string): string => {
  const resources: Record<string, string> = {
    "/api/profile": "/content/profile.json",
    "/api/projects": "/content/projects.json",
  };
  const resource = resources[path];
  if (!resource) throw new Error("UNKNOWN_PUBLIC_CONTENT_RESOURCE");
  return resource;
};
