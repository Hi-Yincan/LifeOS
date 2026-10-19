# 综合看板服务栏目验收

2026-10-19，关联综合看板 #36。用户要求将「会员」改名为「会员看板」，将会员看板、服务器和改名后的自建服务放入「服务」栏目。

## 最终行为

- 一级导航为「总览 / 个人 / 服务」，服务子项按用户确认顺序依次为「自建服务 / 服务器 / 会员看板」。个人原有四个子视图继续保留。
- 从其他栏目进入服务时显示会员看板；已在服务栏目中时，点击栏目入口返回当前子视图列表。任一服务子视图和实体深链接自动展开该栏目。
- 标题、导航、位置栏和状态区同步使用新名称；英文为 Services → Self-hosted services / Servers / Membership dashboard。窄窗口使用既有缩短标签和完整可访问名称。
- 原 `memberships / servers / services` 查询参数与实体 ID 保持兼容。详情、筛选、费用和监测数据仍使用原有只读合成数据。

## 验证结果

基于 `48ebf8167bc866dfb7010308be6db621d569f37b`，在隔离 worktree 的 `feat/dashboard-service-navigation` 分支验证。使用 Node 22.23.3、Yarn 1.22.22 和锁定依赖的 APFS 克隆。

| 检查 | 结果 |
| --- | --- |
| `node scripts/product/build.mjs --public` | 通过，含 TypeScript；资源审计 1747 个文本文件 |
| `yarn lint` | 通过 |
| `yarn test:unit` | 10 suites / 84 tests 通过 |
| `yarn test:server` | 15/15 通过 |
| `PUBLIC_DEPLOYMENT=1 yarn playwright test --config=playwright.dashboard.config.ts` | 42/42 通过，58.1 秒，无跳过 |
| 改动 TS/TSX 文件的 Prettier、`git diff --check` | 通过 |

浏览器回归覆盖栏目键盘进入、中英文切换、子项顺序、新标题和位置栏、历史、旧深链接、筛选及详情往返、原生窗口操作、520px 窄窗口、390/1024/1440px 布局、只读边界，以及作品集、商店和公开入口。

同日按用户确认将子项顺序调整为「自建服务 / 服务器 / 会员看板」后，重新通过公开构建、Lint、改动文件格式与差异检查，并用 `--grep 'language changes and keyboard|vertical navigation'` 重跑两个受影响的浏览器用例，2/2 通过。断言验证中文子项的最终顺序；中英文、键盘切换与 520px 原生窗口导航继续正常。此次仅调整排列，未重复此前已通过的单元和服务端测试。

服务端测试首次在沙箱内因 `listen EPERM` 无法监听本机端口；允许本机监听后重跑全部通过。Lint 首次发现测试辅助数组排序不符合仓库规范，修正排序后通过。没有跳过或削弱断言。

最新验证产物 `out/release.json` 记录 `commit=48ebf8167bc866dfb7010308be6db621d569f37b`、`dirty=true`、`mode=visitor`、`builtAt=2026-10-19T09:09:55.400Z`、`bytes=328584218`。这是包含本次未提交源码的本地验收构建，不是线上发布记录。排序修正的构建和浏览器日志位于 `.cache/agent-work/dashboard-service-navigation-20261019/reorder-{build,browser}.log`。

## 实际浏览证据

使用 Ego task space 88 检查任务专用 4394 预览，通过系统设置切换语言，并实际读取截图。以下截图记录排序修正前的窗口与样式验收，最终顺序以修正后的浏览器用例为准：

- `.cache/agent-work/dashboard-service-navigation-20261019/services-zh-wide.png`：1000px 原生窗口，服务栏目和三个缩进子项、选中态、中文自建服务标题及完整位置栏正常。
- `.cache/agent-work/dashboard-service-navigation-20261019/memberships-zh-520.png`：通过原生右侧缩放手柄缩至 521px；三个子项保持完整中文名称，按钮 `clientWidth=scrollWidth=72`，工作区 `clientWidth=scrollWidth=521`。继续切换服务器和自建服务，当前项与位置栏同步。

这些检查为桌面 Chromium 实际窗口和视口仿真，没有执行手机、iPad 真机测试。本次没有修改服务端、接入真实数据源或更改生产配置。

## 发布与后续核验

本地实施使用隔离 worktree 的 `feat/dashboard-service-navigation` 分支及 4394 任务预览，未修改主工作区。用户随后明确授权推送、合并、清理和生产发布。发布依次通过源码 PR 的 Product checks、合并后 main 检查，以及发布仓库完整访客验证；以 `deployment.json` 固定最终 main 的完整 SHA。

上述构建和截图是本地实施证据。正式 CI、发布工作流、线上 `release.json` 及任务清理结果另记综合看板 #36 的交付评论；不得据本地构建推定上线。任务服务和 worktree 在成果、日志与截图保存后清理。
