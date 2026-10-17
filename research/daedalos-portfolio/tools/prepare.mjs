import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkout = resolve(process.argv[2] || '/tmp/hi-yincan-daedalos-concept');
const expected = 'f017b393d4175eb396a741a7562299423843f1b1';
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim();
if (sha !== expected) throw new Error(`Expected reviewed upstream ${expected}, received ${sha}`);
const directory = execFileSync('git', ['show', 'HEAD:contexts/process/directory.ts'], { cwd: checkout, encoding: 'utf8' });
const originalIds = [...directory.matchAll(/^  (\w+): \{/gm)].map(x => x[1]);
const modified = [];
const removed = [];
const site = JSON.parse(readFileSync(resolve(root, 'overlay/personal-site.json'), 'utf8'));
function modify(file, apply) {
  const baseline = execFileSync('git', ['show', `HEAD:${file}`], { cwd: checkout, encoding: 'utf8' });
  const lf = baseline.replace(/\r\n/g, '\n'), next = apply(lf);
  if (next === lf) throw new Error(`No change applied: ${file}`);
  const target = resolve(checkout, file);
  // Only allow a clean upstream file or this tool's previous output.
  if (existsSync(target)) { const current = readFileSync(target, 'utf8').replace(/\r\n/g, '\n'); if (current !== lf && current !== next) throw new Error(`Unrecognized local edit: ${file}`); }
  writeFileSync(target, baseline.includes('\r\n') ? next.replace(/\n/g, '\r\n') : next); modified.push(file);
}
cpSync(resolve(root, 'overlay'), checkout, { recursive: true });
modify('contexts/process/directory.ts', text => text
  .replace('import dynamic from "next/dynamic";', 'import dynamic from "next/dynamic";\nimport { SETTINGS_ICON } from "components/system/PersonalOS/settingsIcon";')
  .replace('const directory: Processes = {', `const directory: Processes = {
  AppStore: {
    backgroundColor: "#202020",
    Component: dynamic(() => import("components/apps/AppStore")),
    defaultSize: { height: 580, width: 820 },
    icon: "/System/PersonalOS/store.svg", singleton: true, title: "App Store",
  },`)
  .replace('  Properties: {', `  Portfolio: {
    backgroundColor: "#202020",
    Component: dynamic(() => import("components/apps/Portfolio")),
    defaultSize: { height: 640, width: 960 },
    icon: "/System/PersonalOS/portfolio.svg", singleton: true, title: "Portfolio",
  },
  Properties: {`)
  .replace('  Terminal: {', `  SystemSettings: {
    backgroundColor: "#202020",
    Component: dynamic(() => import("components/system/PersonalOS/Settings")),
    defaultSize: { height: 420, width: 500 },
    icon: SETTINGS_ICON, singleton: true, title: "Settings",
  },
  Terminal: {`));
modify('pages/_app.tsx', text => text.replace('import "utils/polyfills";', 'import "utils/polyfills";\nimport "components/system/PersonalOS/personal.css";\nimport { PersonalOSProvider } from "components/system/PersonalOS/context";').replace('<MenuProvider>', '<PersonalOSProvider><MenuProvider>').replace('</MenuProvider>', '</MenuProvider></PersonalOSProvider>'));
modify('pages/index.tsx', text => text.replace('import AppsLoader', 'import PersonalShell from "components/system/PersonalOS/Shell";\nimport AppsLoader').replace('<AppsLoader />', '<AppsLoader />\n      <PersonalShell />'));
modify('components/system/Window/Titlebar/index.tsx', text => text.replace('import { useRef }', 'import { usePersonalOS } from "components/system/PersonalOS/context";\nimport { useRef }').replace('const Titlebar: FC<TitlebarProps> = ({ id }) => {', 'const Titlebar: FC<TitlebarProps> = ({ id }) => {\n  const { locale } = usePersonalOS();').replace('label("Minimize")', 'label(locale === "zh" ? "最小化" : "Minimize")').replace('label("Maximize")', 'label(locale === "zh" ? "最大化" : "Maximize")').replace('label("Close")', 'label(locale === "zh" ? "关闭" : "Close")').replace('label("Restore Down", "Restore")', 'label(locale === "zh" ? "还原" : "Restore Down", locale === "zh" ? "还原" : "Restore")'));
// The shared site configuration owns identity; upstream licenses remain intact.
modify('utils/constants.ts', text => text
  .replace('import { type AsyncZipOptions } from "fflate";', 'import { type AsyncZipOptions } from "fflate";\nimport site from "personal-site.json";')
  .replace('export const FAVICON_BASE_PATH = "/favicon.ico";', 'export const FAVICON_BASE_PATH = site.icon;')
  .replace(/  alias: "daedalOS",\n  author: \{[\s\S]*?\n  \},\n  description: "Desktop environment in the browser",/, '  alias: site.name,\n  author: { name: site.name, url: site.url },\n  description: site.description,'));
modify('components/pages/hooks/useFaviconAndTitle.tsx', text => text
  .replace('const Favicon = createFavicon(favIcon);', 'const Favicon = createFavicon(FAVICON_BASE_PATH);'));
modify('components/pages/Metadata.tsx', text => text
  .replace('import Head from "next/head";', 'import Head from "next/head";\nimport site from "personal-site.json";')
  .replace('<meta content={alias} property="og:title" />', '<meta content={alias} property="og:title" />\n      <meta content={alias} property="og:site_name" />\n      <link href={author.url} rel="canonical" />')
  .replace('`${author.url}/screenshot.png`', '`${author.url}${site.icon}`')
  .replace(/      <link\n        href=\{`\$\{author.url\}\/rss.xml`\}[\s\S]*?      \/>\n/, ''));
modify('package.json', text => text
  .replace('"name": "daedalos"', '"name": "yincan-personal-os"')
  .replace('"description": "Desktop environment in the browser"', `"description": ${JSON.stringify(site.description)}`)
  .replace(/  "author": \{[\s\S]*?\n  \},/, `  "author": ${JSON.stringify({ name: site.name, url: site.url })},`)
  .replace('node scripts/robots.js && node scripts/rssBuilder.js', 'node scripts/personalSite.cjs'));
modify('components/apps/Browser/config.ts', text => text
  .replace('import { get9pModifiedTime } from "contexts/fileSystem/core";\n', '')
  .replace('import { FAVICON_BASE_PATH }', 'import { FAVICON_BASE_PATH, PACKAGE_DATA }')
  .replace(/export const SURF_TO_MISC = \{[\s\S]*?\};\n\n/, '')
  .replace('    name: "daedalOS",\n    url: "https://dustinbrett.com/",', '    name: PACKAGE_DATA.alias,\n    url: PACKAGE_DATA.author.url,')
  .replace('  ...(get9pModifiedTime(SURF_TO_MISC.path) === -1 ? [] : [SURF_TO_MISC]),\n', ''));
modify('components/apps/Browser/index.tsx', text => text
  .replace('  SURF_TO_MISC,\n', '')
  .replace('      if (lowerAddressInput.startsWith(SURF_TO_MISC.url)) {\n        loadLocalSite(SURF_TO_MISC.path, SURF_TO_MISC.name);\n      } else if (lowerAddressInput.startsWith(DINO_GAME.url)) {', '      if (lowerAddressInput.startsWith(DINO_GAME.url)) {'));
modify('components/apps/Messenger/hooks.ts', text => text
  .replace('import { PACKAGE_DATA, PROCESS_DELIMITER }', 'import { PROCESS_DELIMITER }')
  .replace('[PACKAGE_DATA.author.npub, ...Object.values(wellKnownNames)]', 'Object.values(wellKnownNames)'));
// Do not assume a newly configured domain is on a third-party CORS allowlist.
modify('components/apps/Webamp/functions.ts', text => text
  .replace('  PACKAGE_DATA,\n', '')
  .replace('["localhost", PACKAGE_DATA.author.url.replace("https://", "")].includes(\n    window.location.hostname\n  )', 'window.location.hostname === "localhost"'));
modify('contexts/process/useProcessContextState.ts', text => text.replace('import { useRef, useState }', 'import { canClosePersonalApp } from "components/system/PersonalOS/closeGuards";\nimport { useRef, useState }').replace('const closeWithTransition = (id: string): void => {', 'const closeWithTransition = (id: string): void => {\n    if (!canClosePersonalApp(id)) return;'));
modify('components/system/StartMenu/Sidebar/index.tsx', text => text
  .replace('import { useEffect, useRef, useState } from "react";', 'import { useEffect, useRef, useState } from "react";\nimport { usePersonalOS } from "components/system/PersonalOS/context";\nimport useLaunch from "components/system/PersonalOS/useLaunch";\nimport StartSettingsIcon from "components/system/PersonalOS/StartSettingsIcon";')
  .replace('  const rootFs = useRootFs();', '  const rootFs = useRootFs();\n  const { t } = usePersonalOS();\n  const launch = useLaunch();')
  // Reserve a row for Settings using the existing height-based sidebar policy.
  .replace('buttonAreaCount > 5', 'buttonAreaCount > 6')
  .replace('buttonAreaCount > 4', 'buttonAreaCount > 5')
  .replace('buttonAreaCount > 3', 'buttonAreaCount > 4')
  .replace(`    {
      action: () => {
        setHaltSession(true);`, `    {
      action: () => launch("SystemSettings"),
      icon: <StartSettingsIcon />,
      name: t("settings"),
      ...(collapsed && { tooltip: t("settings") }),
    },
    {
      action: () => {
        setHaltSession(true);`));
// Retire only the exact power-menu helper from the superseded prototype.
const retiredPowerMenu = resolve(checkout, 'components/system/PersonalOS/usePowerMenu.ts');
if (existsSync(retiredPowerMenu)) {
  if (createHash('sha256').update(readFileSync(retiredPowerMenu)).digest('hex') !== '0a1a3eb1dd630649fcb73ad4a4c021ec22223da84ca6b2a9b6299483852ff431') throw new Error('Unrecognized retired power-menu helper; refusing to remove it');
  rmSync(retiredPowerMenu);
}
// Remove only the shortcut generated by the previous prototype recipe.
const oldSettingsShortcut = resolve(checkout, 'public/Users/Public/Start Menu/Settings.url');
if (existsSync(oldSettingsShortcut)) {
  const expectedShortcut = '[InternetShortcut]\nBaseURL=SystemSettings\nComment=Settings\nIconFile=/System/PersonalOS/settings.svg\n';
  if (readFileSync(oldSettingsShortcut, 'utf8').replace(/\r\n/g, '\n') !== expectedShortcut) throw new Error('Unrecognized Settings shortcut; refusing to remove it');
  rmSync(oldSettingsShortcut);
}
for (const [name, app, icon] of [['Portfolio', 'Portfolio', 'portfolio'], ['App Store', 'AppStore', 'store']]) {
  const path = resolve(checkout, `public/Users/Public/Start Menu/${name}.url`); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `[InternetShortcut]\nBaseURL=${app}\nComment=${name}\nIconFile=/System/PersonalOS/${icon}.svg\n`);
  const desktop = resolve(checkout, `public/Users/Public/Desktop/${name}.url`);
  if (existsSync(desktop) && readFileSync(desktop, 'utf8').replace(/\r\n/g, '\n') !== readFileSync(path, 'utf8')) throw new Error(`Unrecognized desktop shortcut: ${name}`);
  writeFileSync(desktop, readFileSync(path));
}
// Remove only reviewed upstream bytes or a known previous prototype artifact.
function retire(file, expectedHash) {
  const target = resolve(checkout, file);
  if (existsSync(target)) {
    const expectedBytes = expectedHash ? undefined : execFileSync('git', ['show', `HEAD:${file}`], { cwd: checkout });
    const hash = data => createHash('sha256').update(file.startsWith('scripts/') ? data.toString('utf8').replace(/\r\n/g, '\n') : data).digest('hex');
    if (!(Array.isArray(expectedHash) ? expectedHash : [expectedHash || hash(expectedBytes)]).includes(hash(readFileSync(target)))) throw new Error(`Unrecognized retired file: ${file}`);
    rmSync(target);
  }
  removed.push(file);
}
for (const file of ['public/favicon.ico', 'public/screenshot.png', 'scripts/robots.js', 'scripts/rssBuilder.js']) retire(file);
retire('public/System/PersonalOS/settings.svg', 'eb83f8fb8832150bd3ca7523bd87710cb4134614addedb979b688280060cda5c');
retire('public/System/PersonalOS/capture.js', 'a90b42909d80964269ef6d5f3d1e4a5a7e2a4c263a5d2a76a9e7151901343262');
retire('components/system/PersonalOS/site.ts', ['28eb040de3441c4312d6a4c43d4ecd9d30029aba49e5eb35500925b6bb9021e5', '58aba5bf509b34403a7483d720eeff078729febf3dc9b0e02e8a74aa4416b392']);
// rss.xml is a generated, ignored artifact. This product has no blog feed yet.
rmSync(resolve(checkout, 'public/rss.xml'), { force: true });
removed.push('public/rss.xml');
const result = { upstreamSHA: sha, originalAppCount: originalIds.length, originalApps: originalIds, addedProcesses: ['Portfolio', 'SystemSettings', 'AppStore'], desktopShortcuts: ['Portfolio', 'App Store'], modifiedUpstreamFiles: modified, removedFiles: removed, originalAppEntriesRemoved: 0, checkout };
mkdirSync(resolve(root, 'evidence'), { recursive: true }); writeFileSync(resolve(root, 'evidence/integration-manifest.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
