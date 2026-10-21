import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const site = JSON.parse(readFileSync(resolve(root, "lifeos.json"), "utf8"));
const source = resolve(root, "public", `.${site.icon}`);
const iconDirectory = resolve(root, "public", `.${dirname(site.appIcon)}`);
const iconName = basename(site.appIcon, extname(site.appIcon));
const sizes = [16, 32, 48, 96, 144];
const assets = [];

for (const size of sizes) {
  const directory = resolve(iconDirectory, `${size}x${size}`);
  const webp = resolve(directory, `${iconName}.webp`);
  const png = resolve(directory, `${iconName}.png`);
  mkdirSync(directory, { recursive: true });
  execFileSync("cwebp", [
    "-quiet",
    "-q",
    "90",
    "-m",
    "6",
    "-resize",
    String(size),
    String(size),
    source,
    "-o",
    webp,
  ]);
  // PNG 保留同一透明图像，供不支持 WebP 的原生图标路径回退。
  execFileSync("dwebp", ["-quiet", webp, "-o", png]);
  assets.push({
    size,
    webpBytes: readFileSync(webp).length,
    pngBytes: readFileSync(png).length,
  });
}

copyFileSync(
  resolve(iconDirectory, "48x48", `${iconName}.png`),
  resolve(root, "public", `.${site.favicon}`)
);

// 已保存的旧快捷方式继续使用原 URL；内嵌小图使 SVG 保持独立可显示。
const legacyImage = readFileSync(
  resolve(iconDirectory, "144x144", `${iconName}.png`)
);
const legacySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><image width="144" height="144" href="data:image/png;base64,${legacyImage.toString("base64")}"/></svg>\n`;
writeFileSync(resolve(root, "public/System/LifeOS/portfolio.svg"), legacySvg);

console.log(
  JSON.stringify(
    {
      sourceSha256: createHash("sha256")
        .update(readFileSync(source))
        .digest("hex"),
      assets,
      legacySvgBytes: Buffer.byteLength(legacySvg),
      legacySvgGzipBytes: gzipSync(legacySvg).length,
    },
    null,
    2
  )
);
