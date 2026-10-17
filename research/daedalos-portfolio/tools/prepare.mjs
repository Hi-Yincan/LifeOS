import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
modify('contexts/process/directory.ts', text => text.replace('const directory: Processes = {', `const directory: Processes = {
  Portfolio: {
    Component: dynamic(() => import("components/apps/Portfolio")),
    defaultSize: { width: 960, height: 640 },
    icon: "/System/PersonalOS/portfolio.svg", title: "Portfolio", singleton: true, backgroundColor: "#202020",
  },
  SystemSettings: {
    Component: dynamic(() => import("components/system/PersonalOS/Settings")),
    defaultSize: { width: 500, height: 420 },
    icon: "/System/PersonalOS/settings.svg", title: "Settings", singleton: true, backgroundColor: "#202020",
  },`));
modify('pages/_app.tsx', text => text.replace('import "utils/polyfills";', 'import "utils/polyfills";\nimport "components/system/PersonalOS/personal.css";\nimport { PersonalOSProvider } from "components/system/PersonalOS/context";').replace('<MenuProvider>', '<PersonalOSProvider><MenuProvider>').replace('</MenuProvider>', '</MenuProvider></PersonalOSProvider>'));
modify('pages/index.tsx', text => text.replace('import AppsLoader', 'import PersonalShell from "components/system/PersonalOS/Shell";\nimport AppsLoader').replace('<AppsLoader />', '<AppsLoader />\n      <PersonalShell />'));
modify('components/system/Window/Titlebar/index.tsx', text => text.replace('import { useRef }', 'import { usePersonalOS } from "components/system/PersonalOS/context";\nimport { useRef }').replace('const Titlebar: FC<TitlebarProps> = ({ id }) => {', 'const Titlebar: FC<TitlebarProps> = ({ id }) => {\n  const { locale } = usePersonalOS();').replace('label("Minimize")', 'label(locale === "zh" ? "最小化" : "Minimize")').replace('label("Maximize")', 'label(locale === "zh" ? "最大化" : "Maximize")').replace('label("Close")', 'label(locale === "zh" ? "关闭" : "Close")').replace('label("Restore Down", "Restore")', 'label(locale === "zh" ? "还原" : "Restore Down", locale === "zh" ? "还原" : "Restore")'));
modify('components/pages/Metadata.tsx', text => text.replace('<meta content={description} name="description" />', '<meta content="Yincan Huang — open-source projects and contributions." name="description" />'));
modify('contexts/process/useProcessContextState.ts', text => text.replace('import { useRef, useState }', 'import { canClosePersonalApp } from "components/system/PersonalOS/closeGuards";\nimport { useRef, useState }').replace('const closeWithTransition = (id: string): void => {', 'const closeWithTransition = (id: string): void => {\n    if (!canClosePersonalApp(id)) return;'));
for (const [name, app, icon] of [['Portfolio', 'Portfolio', 'portfolio'], ['Settings', 'SystemSettings', 'settings']]) {
  const path = resolve(checkout, `public/Users/Public/Start Menu/${name}.url`); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `[InternetShortcut]\nBaseURL=${app}\nComment=${name}\nIconFile=/System/PersonalOS/${icon}.svg\n`);
  if (app === 'Portfolio') writeFileSync(resolve(checkout, 'public/Users/Public/Desktop/Portfolio.url'), readFileSync(path));
}
// A DOM-render capture helper for this research environment; not a production dependency.
const helper = resolve(checkout, 'node_modules/html-to-image/dist/html-to-image.js');
if (existsSync(helper)) cpSync(helper, resolve(checkout, 'public/System/PersonalOS/capture.js'));
const result = { upstreamSHA: sha, originalAppCount: originalIds.length, originalApps: originalIds, addedProcesses: ['Portfolio', 'SystemSettings'], modifiedUpstreamFiles: modified, originalAppEntriesRemoved: 0, checkout };
mkdirSync(resolve(root, 'evidence'), { recursive: true }); writeFileSync(resolve(root, 'evidence/integration-manifest.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
