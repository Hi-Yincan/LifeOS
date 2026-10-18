# 原型启动、系统设置与商店入口审查

2026-10-17；独立 worker：`codex-forward-shell-audit`；批次：`prototype-audit`，任务：`shell-audit`。

## 基线与范围

实际审查基线为 `a59eda1f195e2f46d6a3cab574c2fd3f3625095f`，审查开始时 assigned worktree 干净。仅新增本报告；未改产品源码、未启动或复用现有原型服务、未运行 prepare/build、未操作 Power、未访问浏览器或生产环境。

先读取当前 `specs/concept/README.md`、`implementation-plan.md`、`prototype-handoff.md`、`acceptance.md`、`system-settings.md`、`app-store.md`，再对照相关源码。默认桌面、商店桌面快捷方式以及 OS 设置左栏入口均以当前规格为准，未沿用旧自动打开作品集的设计。

## 发现

1. **规格不一致，建议在下一轮任务拆分前修正。** `specs/concept/flows-and-states.md:77` 的代表性验证路径仍要求“新访客→自动作品集”，但同文件 `:42`、`specs/concept/acceptance.md:9` 和最新 `specs/concept/prototype-handoff.md:32` 均要求无参数首次访问显示桌面、不自动打开作品集或商店。当前 `research/daedalos-portfolio/overlay/components/system/LifeOS/Shell.tsx:11` 仅在显式 `app=Portfolio` 时启动作品集，与最新交接一致。建议将旧路径改为“新访客→桌面→主动打开作品集”，并单列显式深链接场景。否则新 agent 可能据此误修正确的启动行为。

2. **源码可确认的错误反馈缺口，建议补独立修复任务。** `research/daedalos-portfolio/overlay/components/system/LifeOS/Settings.tsx:17` 中注销按钮直接 `await request("/api/session", { method: "DELETE", ... })`，没有 `try/catch`、没有写入可见 `error`，也没有进行中状态。同文件登录分支已有这些处理。`research/daedalos-portfolio/overlay/components/system/LifeOS/context.tsx:43` 的 request 会在请求/响应解析失败或非成功响应时抛错；网络中断或服务端 5xx 时，注销因此可能留下未处理的 Promise rejection，并仍显示 admin 状态而没有明确失败提示。影响 `specs/concept/acceptance.md:16` 的单密钥登录/注销可用性。建议保留真实会话状态，同时显示本地化错误并允许重试；用故障响应验证。此结论来自控制流审查，尚无浏览器复现，也不意味着注销成功路径失败。

## 与最新要求相符的源码观察

| 要求 | 当前观察与引用 | 证据边界 |
| --- | --- | --- |
| 默认桌面、显式作品集链接 | `Shell.tsx:11` 受 loaded、route 与 `app=Portfolio` 条件控制；其他原生 app 参数没有被此桥接器主动打开的作品集覆盖 | 未实测 upstream AppsLoader 或会话恢复 |
| Portfolio / App Store 双入口与单实例 | `tools/prepare.mjs:30`、`:36` 注册 singleton；`:122` 为两者各生成开始菜单、桌面快捷方式；`useLaunch.ts:8` 在已有窗口时恢复最小化并设前景与焦点 | 构建索引、快捷方式双击和焦点实际表现尚待独立浏览器验证 |
| 设置由 OS 左栏进入 | `tools/prepare.mjs:87` 的 Sidebar 补丁移除 Documents/Pictures/Videos，并在 Power 前加入直接 launch SystemSettings 的按钮；`:115` 只清理已知旧 Settings 快捷方式；`:43` 设置 singleton | 未生成临时 upstream checkout，因此没有对补丁后 Sidebar 与上游 Power 回调作逐字比较；不能判 A08 全通过 |
| 应用默认无设置按钮 | Portfolio 与 AppStore 当前组件未见 Settings/SystemSettings 入口；系统设置单独承载语言与折叠维护区域（`Settings.tsx:16`、`:17`） | 只覆盖当前自研两 App，不扩大到所有上游应用 |
| 商店三分类、再次点击取消、搜索保留 | `AppStore/index.tsx:160` 默认无筛选；`:245` 联合搜索过滤；`:373` 仅三个栏目且再次点击变 undefined；reset (`:255`) 不清空 search | 未测渲染、触屏与窄屏布局 |
| 商店原生/第三方启动语义 | `AppStore/catalog.ts:48` 从 process directory 生成目录并排除 dialogProcess/SystemSettings；`:69` 将 AppStore 与 Portfolio 归应用软件；`AppStore/index.tsx:262` 的文件型应用打开 FileExplorer，启用的外链用新标签及 noopener noreferrer | 33 注册/30 商品只得到历史 manifest 与生成规则支持，本次没有重新生成目录或逐 App 运行验证 |

上表短路径均相对于 `research/daedalos-portfolio/`，`Shell.tsx`、`Settings.tsx`、`useLaunch.ts` 均位于 `overlay/components/system/LifeOS/`；AppStore 短路径位于 `overlay/components/apps/`。历史 `evidence/integration-manifest.json` 仅作已有证据阅读，不作为本次重新执行的结果。

## 本次执行的检查

环境：Node `v26.7.0`，Python `3.14.0b3`。以下命令均在隔离 worker worktree 执行：

| 命令 | 实际结果 | 能说明什么 |
| --- | --- | --- |
| `node --check research/daedalos-portfolio/service.mjs` | exit 0 | JS 语法通过 |
| `node --check research/daedalos-portfolio/tools/prepare.mjs` | exit 0 | 原型接入脚本语法通过，未运行脚本 |
| `node --test research/daedalos-portfolio/test/app-store.test.mjs` | exit 0；3/3 通过 | URL 拒绝规则、清单约束、应用库数据模型；不覆盖 React 点击与存储 UI |

提交后另由批次 helper 绑定实际报告提交执行 `prepare-syntax` 和 `report-present`，其精确结果以批次 gate 日志为准。本报告没有将源码、语法检查或模型测试换算为真实浏览器交互通过；没有构建、原生 App 全量、真机、多语言交互、生产安全或发布验证结论。

## 后续验证建议与协作体验

优先用独立浏览器配置和新 runtime 验证：无参数首次访问；显式原生 app/Portfolio 深链接；桌面与 Start Menu 重复启动商店的单实例恢复；设置折叠/展开及键盘到达；模拟注销网络失败。使用当前原型时应先分配 runtime、端口和浏览器 profile，避免清空用户已有会话。

任务 packet 给出了绝对 worktree、精确 owned 文件、token 和 gate 参数；不需要启动任何特定 provider CLI，普通 Git/Python/Node 即可执行。claim 与并行读取不冲突。本轮未观察到 helper 操作阻断。仍须注意：Node 版本要求只存在于被测产品工具链，项目 helper 的 Python 3.9+ 兼容性不能由本机 Python 3.14 单次执行证明；这不影响本报告任务，但跨 agent 交接应携带实际 gate 工具需求。
