// Static releases have public snapshots and no authentication or write API.
export const STATIC_CONTENT = process.env.NEXT_PUBLIC_CONTENT_MODE === "static";

export const publicContentPath = (path: string): string => {
  const resources: Record<string, string> = {
    "/api/profile": "/content/profile.json",
    "/api/projects": "/content/projects.json",
  };
  const resource = resources[path];
  if (!resource) throw new Error("READ_ONLY_DEPLOYMENT");
  return resource;
};
