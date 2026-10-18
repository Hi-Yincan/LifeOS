import assert from "node:assert/strict";

export const publicSnapshot = (source) => {
  const pick = (value, fields) =>
    Object.fromEntries(fields.map((field) => [field, value[field]]));
  const translated = (value) =>
    Object.fromEntries(["zh", "en"].map((locale) => [locale, value[locale]]));
  const profile = pick(source.profile, ["name", "email", "github"]);
  for (const field of ["headline", "bio", "education"])
    profile[field] = translated(source.profile[field]);
  const projects = source.projects
    .filter((item) => item.published === true)
    .map((item) => {
      assert.ok(
        !item.imageId,
        `Publish media explicitly before exporting ${item.id}`
      );
      const project = pick(item, [
        "id",
        "kind",
        "order",
        "accent",
        "technology",
        "repository",
        "website",
        "video",
      ]);
      project.translations = Object.fromEntries(
        ["zh", "en"].map((locale) => [
          locale,
          pick(item.translations[locale], [
            "title",
            "summary",
            "background",
            "contribution",
            "detail",
          ]),
        ])
      );
      project.imageUrl = null;
      project.featured = item.featured === true;
      return project;
    })
    .sort((a, b) => a.order - b.order);
  return { profile, projects };
};
