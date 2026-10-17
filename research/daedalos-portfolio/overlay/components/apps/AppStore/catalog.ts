import directory from "contexts/process/directory";

export type CatalogApp = {
  description: [string, string];
  fileBased: boolean;
  icon: string;
  id: string;
  name: string;
  source: "adapted" | "native";
};
const descriptions: Record<string, [string, string]> = {
  Browser: ["daedalOS 内置浏览器。", "The built-in daedalOS browser."],
  Chess: ["在桌面窗口中下国际象棋。", "Play chess in a desktop window."],
  FileExplorer: [
    "浏览与管理当前浏览器中的文件。",
    "Browse and manage files in this browser.",
  ],
  MonacoEditor: ["编辑文本和代码文件。", "Edit text and source files."],
  Paint: [
    "使用原生绘图工具创作和编辑图片。",
    "Create and edit images with the built-in paint application.",
  ],
  Portfolio: [
    "浏览开源项目、源码与在线体验。作者可管理公开内容。",
    "Explore open-source projects, source code and live demos. Author content management is included.",
  ],
  Terminal: [
    "使用 daedalOS 的终端与内置命令。",
    "Use the daedalOS terminal and built-in commands.",
  ],
};
// File handlers and system dialogs are not equivalent to standalone launchable apps.
const fileBased = new Set([
  "Emulator",
  "JSDOS",
  "Marked",
  "OpenType",
  "PDF",
  "Photos",
  "Ruffle",
  "V86",
  "VideoPlayer",
]);
export const catalog: CatalogApp[] = Object.entries(directory)
  .filter(
    ([id, process]) =>
      !process.dialogProcess && !["AppStore", "SystemSettings"].includes(id)
  )
  .map(([id, process]): CatalogApp => ({
    description:
      descriptions[id] ||
      (fileBased.has(id)
        ? [
            "打开兼容文件时使用的原生应用。请先在文件资源管理器中选择文件。",
            "A built-in file application. Select a compatible file in File Explorer first.",
          ]
        : [
            "daedalOS 原生应用，保持上游运行方式。部分应用需要网络、数据文件或浏览器特性支持。",
            "A built-in daedalOS application. Some apps require network access, data files or browser capabilities.",
          ]),
    fileBased: fileBased.has(id),
    icon: process.icon,
    id,
    name: process.title,
    source: id === "Portfolio" ? "adapted" : "native",
  }))
  .sort(
    (a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name)
  );
