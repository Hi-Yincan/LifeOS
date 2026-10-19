# 浏览器桌面入口与收藏

2026-10-19，关联 Issue #9「内置应用」合集。

桌面新增 Browser 快捷方式，与开始菜单共用已有 Browser 进程及 Chromium 图标。默认访问网站仍只显示桌面，双击入口后打开浏览器。

默认图标位置通过原生 `public/session.json` 配置，按用户截图设置为以下两列；继续使用原生网格尺寸和拖动排列，已有本机布局仍由会话保存及恢复机制维护。

| 行 | 左列 | 右列 |
| --- | --- | --- |
| 1 | My PC | Browser |
| 2 | Public | Portfolio |
| 3 | App Store | |
| 4 | Dashboard | |

浏览器收藏栏按以下顺序显示五个入口，沿用原生图标按钮与悬停提示：

| 收藏 | 地址 |
| --- | --- |
| localhost | `http://localhost/` |
| Google | `https://www.google.com/webhp?igu=1` |
| hyc.ac | `https://hyc.ac/` |
| hyc.ac/gallery | `https://hyc.ac/gallery` |
| aipm.ac | `https://aipm.ac/` |

Google 继续使用已有嵌入地址。localhost 继续访问 OS 虚拟文件系统目录。浏览器主页、地址栏、历史、代理菜单及收藏的新窗口行为沿用现有实现。

AIPM 收藏使用站点首页声明的 `https://aipm.ac/favicon.svg`，于 2026-10-19 原样保存至 `public/System/LifeOS/aipm.svg`。界面读取本地 SVG 资源，保持原站图形。

## 验证记录

- 使用 Node 22.23.3、Yarn 1.22.22 完成 `yarn build`、构建资源检查、`yarn lint` 和 `git diff --check`。
- 使用 ego-browser 检查实际构建：默认进入桌面、Browser 图标存在、双击启动、五个收藏的顺序及图标加载均通过；逐项点击后地址栏显示表中目标地址。
- localhost 显示虚拟文件系统目录，Google 在窗口中显示搜索页面；验证通过键盘 Enter 启用收藏。
- 在中文和英文 OS 环境中检查入口及收藏栏；检查默认 600px 窗口、最大化与还原，并实际拖动原生边缘把窗口缩窄至 350px，五个收藏仍完整可见。截图保存在任务工作区 `.cache/agent-work/browser-bookmarks-20261019/`。
- 未覆盖手机、iPad 真机、跨地区网络，以及 hyc.ac、图库和 AIPM 页面内部功能。视口模拟不作为移动设备验收依据。

新增 AIPM 原站图标与默认桌面位置后，重新完成完整构建、资源检查、lint 和 `git diff --check`。在 `http://localhost:4394` 的新会话中，逐项核对六个图标的实际网格行列，与上述位置表一致；原来保存过排列的会话继续保留原布局。实际双击 Browser，确认 AIPM 图标读取 `/System/LifeOS/aipm.svg` 且加载成功，点击后地址栏显示 `https://aipm.ac/`。实际页面截图保存为 `default-layout.png` 和 `aipm-bookmark.png`。

验证使用独立 worktree；收尾时预览端口为 4394，4392 和 4393 未监听。本任务只启停任务专用预览，没有启停原有 4392 服务。未修改原有运行数据，未部署生产环境。
