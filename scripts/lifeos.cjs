const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const site = require("../lifeos.json");

const xml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const output = (name, content) => writeFileSync(resolve(__dirname, "../public", name), content);
const urls = site.entryPoints.map((path) => `<url><loc>${xml(new URL(path, site.url).href)}</loc></url>`);

output("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
output("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>\n`);
