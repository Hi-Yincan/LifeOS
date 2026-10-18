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
  AppStore: [
    "搜索、分类和打开桌面应用，收藏常用工具，添加自己的网页应用入口。",
    "Find and launch desktop apps, save favorites, and add shortcuts to your own web apps.",
  ],
  BoxedWine: [
    "通过 Wine 运行部分 Windows .exe 程序及其 .zip 软件包，适合旧版软件和游戏。",
    "Run compatible Windows .exe programs and .zip application packages through Wine, including older software and games.",
  ],
  Browser: [
    "在桌面窗口中浏览网页或打开 .html/.htm 文件，提供地址栏、书签和前进后退。",
    "Browse websites and .html/.htm files in a desktop window, with an address bar, bookmarks, and back/forward navigation.",
  ],
  Chess: [
    "与 Stockfish 对弈并调整棋力，查看走棋记录，载入 .pgn 棋谱回看对局。",
    "Play against Stockfish at adjustable skill levels, review moves, and load .pgn files to replay games.",
  ],
  ClassiCube: [
    "在方块世界中放置和拆除方块，建造建筑并探索地图的沙盒游戏。",
    "Build structures and explore block worlds in a sandbox game by placing and removing blocks.",
  ],
  Dashboard: [
    "在统一看板中查看个人状况、会员、服务与服务器，使用合成示例体验筛选、详情和编辑。",
    "Explore personal status, memberships, services and servers in one dashboard with interactive sample records.",
  ],
  DevTools: [
    "查看本站的 JavaScript 控制台、页面元素和网络请求，辅助调试网页。",
    "Inspect this site's JavaScript console, page elements, and network requests to debug the page.",
  ],
  DXBall: [
    "移动挡板接住弹球、击碎砖块，并收集道具挑战关卡的街机游戏。",
    "Move the paddle to bounce the ball, break bricks, and collect power-ups in an arcade game.",
  ],
  Emulator: [
    "运行 NES（.nes）、SNES（.sfc/.smc）、Game Boy/GBA（.gb/.gbc/.gba）、DS（.nds）和 N64（.n64/.z64）等游戏 ROM。",
    "Play console ROMs including NES (.nes), SNES (.sfc/.smc), Game Boy/GBA (.gb/.gbc/.gba), DS (.nds), and N64 (.n64/.z64).",
  ],
  FileExplorer: [
    "管理此桌面的文件和文件夹，上传、下载、重命名或删除文件，并浏览 ZIP 压缩包与 ISO 镜像。",
    "Manage this desktop's files and folders: upload, download, rename, delete, and browse ZIP archives or ISO images.",
  ],
  IRC: [
    "连接 IRC 聊天网络，加入频道参与群聊，或通过昵称与其他用户私聊。",
    "Connect to IRC networks, join channels for group conversations, and message other users by nickname.",
  ],
  JSDOS: [
    "在 DOS 环境中运行旧游戏和程序，载入 .jsdos 游戏包、.zip 压缩包或 DOS .exe 文件。",
    "Run classic DOS games and programs from .jsdos bundles, .zip archives, or DOS .exe files.",
  ],
  Marked: [
    "阅读 .md Markdown 文档，将标题、列表、代码块和链接显示为排版后的页面。",
    "Read .md Markdown documents as formatted pages with headings, lists, code blocks, and links.",
  ],
  Messenger: [
    "通过 Nostr 网络收发私信，使用 Nostr 身份和中继服务器连接联系人。",
    "Send and receive private messages over Nostr using a Nostr identity and relay servers.",
  ],
  MonacoEditor: [
    "编辑 .txt 文本及 .js、.ts、.py、.json、.html、.css 等代码文件，提供语法高亮、查找替换和保存。",
    "Edit .txt files and code such as .js, .ts, .py, .json, .html, and .css, with syntax highlighting, find/replace, and saving.",
  ],
  OpenType: [
    "预览 .ttf、.otf 和 .woff 字体，查看字体名称、版本及不同字号的文字效果。",
    "Preview .ttf, .otf, and .woff fonts, including their name, version, and sample text at different sizes.",
  ],
  Paint: [
    "用画笔、形状和文字绘图，打开并编辑 PNG、JPEG、BMP、GIF、WebP 等图片。",
    "Draw with brushes, shapes, and text, or open and edit images such as PNG, JPEG, BMP, GIF, and WebP.",
  ],
  PDF: [
    "阅读 .pdf 文档，按页浏览、跳转页码、缩放页面，并下载或打印文档。",
    "Read .pdf documents, browse or jump to pages, zoom, and download or print the document.",
  ],
  Photos: [
    "查看 PNG、JPEG、GIF、WebP、BMP、SVG、TIFF、HEIC 等图片，支持缩放、切换相邻图片和全屏查看。",
    "View images including PNG, JPEG, GIF, WebP, BMP, SVG, TIFF, and HEIC, with zoom, adjacent-image navigation, and full screen.",
  ],
  Portfolio: [
    "了解 Yincan Huang 的项目与参与贡献，阅读项目详情，访问源码和在线演示。",
    "Explore Yincan Huang's projects and contributions, read project details, and visit source repositories and live demos.",
  ],
  Quake3: [
    "在 Quake III Arena 的竞技场中移动、拾取武器并与对手进行第一人称射击对战。",
    "Move through Quake III Arena's arenas, collect weapons, and fight opponents in first-person combat.",
  ],
  Ruffle: [
    "播放 .swf Flash 动画和游戏，也可打开 .spl FutureSplash 文件，无需 Flash 浏览器插件。",
    "Play .swf Flash animations and games or open .spl FutureSplash files without the Flash browser plugin.",
  ],
  SpaceCadet: [
    "经典太空主题弹球游戏，用左右挡板击球、完成球台目标并争取高分。",
    "Play classic space-themed pinball: use the flippers, complete table objectives, and chase a high score.",
  ],
  StableDiffusion: [
    "输入文字提示生成图片，并保存为 PNG；需要支持 WebGPU 的浏览器，首次使用需下载模型。",
    "Generate images from text prompts and save them as PNG. Requires WebGPU support and an initial model download.",
  ],
  Terminal: [
    "用命令浏览和管理此桌面的文件、启动应用；输入 help 查看可用命令。",
    "Use commands to browse and manage this desktop's files or launch apps. Enter help to see available commands.",
  ],
  Tic80: [
    "用于制作和运行像素游戏的 TIC-80 虚拟计算机，可载入 .tic 游戏卡带。",
    "Create and run pixel games in the TIC-80 fantasy computer, including games loaded from .tic cartridges.",
  ],
  TinyMCE: [
    "编辑带格式的文字、图片和链接，保存为 .whtml 文档；也可导入 .rtf 富文本文件。",
    "Edit formatted text, images, and links, save as .whtml documents, and import .rtf rich-text files.",
  ],
  V86: [
    "模拟 x86 电脑，启动 .iso 光盘镜像、.img/.dsk 磁盘镜像或 .bin Linux 内核。",
    "Emulate an x86 PC and boot .iso disc images, .img/.dsk disk images, or .bin Linux kernels.",
  ],
  VideoPlayer: [
    "播放 MP4、WebM、MKV、MOV、AVI 等视频及 MP3、WAV、FLAC 等音频；可播放的编码取决于浏览器和解码器。",
    "Play videos such as MP4, WebM, MKV, MOV, and AVI, plus MP3, WAV, and FLAC audio. Codec support depends on the browser and decoder.",
  ],
  Vim: [
    "用 Vim 的普通、插入和命令模式编辑 .txt 文本及 .js、.py、.md 等源文件。",
    "Edit .txt files and source files such as .js, .py, and .md using Vim's normal, insert, and command modes.",
  ],
  Webamp: [
    "以经典 Winamp 界面播放 MP3，打开 .m3u/.pls/.asx 播放列表，并加载 .wsz 皮肤。",
    "Play MP3 audio in a classic Winamp interface, open .m3u/.pls/.asx playlists, and load .wsz skins.",
  ],
};
// 文件类应用直接启动自身窗口，此分类仅用于说明文件载入方式。
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
  .filter(([id, process]) => !process.dialogProcess && id !== "SystemSettings")
  .map(([id, process]): CatalogApp => {
    const description = descriptions[id];

    if (!description) throw new Error(`Missing App Store description: ${id}`);

    return {
      description,
      fileBased: fileBased.has(id),
      icon: process.icon,
      id,
      name: process.title,
      source: ["AppStore", "Dashboard", "Portfolio"].includes(id)
        ? "adapted"
        : "native",
    };
  })
  .sort(
    (a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name)
  );
