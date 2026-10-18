# 应用商店卡片直接启动

2026-10-18 · 关联 Issue #19。

用户要求单击 App Store 卡片直接打开应用。卡片主体现在提供原生按钮或链接，覆盖图标、标题、简介和留白区域；“详情”是独立按钮，不触发启动。全部内置应用按自身 app ID 启动，已有窗口恢复前台，网页应用在新标签打开，停用的网页应用不可启动。

## 验证

在独立 worktree 使用 Node 22.23.3 执行 `node scripts/product/build.mjs`（与 `yarn build` 相同入口），完成类型检查、生产编译、静态导出和站点资源审计；`node node_modules/oxlint/bin/oxlint` 及 `git diff --check` 通过。

使用 ego-browser 对构建产物和真实本地内容服务检查：

- 中文界面点击作品集卡片空白区域，打开作品集窗口。
- 点击作品集“详情”只显示商店详情，当时仅有商店窗口。
- 最小化作品集后，聚焦其卡片并按 Space，恢复原窗口，窗口数量仍为 1。
- 聚焦 App Store 卡片并按 Enter，商店窗口数量仍为 1。
- 切换英文后，添加明确标识为测试用途的网页应用；点击卡片打开 `https://example.com/` 新标签。停用后，卡片启动按钮为 disabled，卡片不再包含链接；测试记录已通过界面移除。
- 390px 宽视口中，内容区 clientWidth 与 scrollWidth 均为 373px；聚焦作品集卡片并按 Enter 成功打开应用。

初轮 ego-browser 截图接口连续超时，未完成截图视觉验收；未验证真实手机、iPad 或其他浏览器。未执行全量 E2E 与服务测试，本次未修改服务或持久化逻辑。

## 文件类应用启动回归

用户反馈 Photos、PDF、Video Player 等卡片打开 My PC。根因是卡片和详情页都使用 `app.fileBased ? "FileExplorer" : app.id` 替换启动目标；`fileBased` 实际只需要描述兼容文件的使用方式，不应决定启动其他应用。

在修复前运行 `node node_modules/@playwright/test/cli.js test --config=.cache/agent-work/playwright.store-local.config.ts --grep 'store opens file app Photos'`，检查在 6.1 秒内失败：找不到 Photos 对话框，页面快照显示 My PC。该配置使用独立预览端口 4394，实际断言保存在 `e2e/product.spec.ts`。

已将两个入口统一改为 `launch(app.id)`，按钮统一显示“打开”/“Open”，文件类应用的中英文说明改为在应用窗口中载入或拖入兼容文件。回归检查覆盖 Emulator、JSDOS、Marked、OpenType、PDF、Photos、Ruffle、V86、VideoPlayer 的卡片和详情页入口，并断言 My PC 不会出现。

修复后的完整构建、lint 和 `git diff --check` 通过。执行上述本地配置并使用 `--grep 'store opens file app|store defaults to all'`，10 项检查全部通过（2.0 分钟）。随后增加窗口透明度恢复到 1 的断言，针对 Photos、PDF、VideoPlayer 重新运行，3 项检查全部通过（43.9 秒）。已查看稳定截图：Photos 显示拖入图片提示，PDF 显示自身工具栏和空文档区域，Video Player 显示播放器和播放控件。截图位于该 worktree 的忽略目录 `test-results/`；本轮没有验证具体文件格式解码或播放能力。

## 应用简介重写

按用户反馈重写全部 30 个内置应用的中英文简介。文件类应用明确列出格式或扩展名；游戏、聊天、开发工具和自有应用分别描述具体用途。视频简介保留编码兼容条件，BoxedWine 明确只运行兼容的 Windows 程序，Stable Diffusion 说明 WebGPU 与模型下载要求。移除两类通用兜底简介，目录缺少专属简介时明确报错。

格式与能力依据当前源码核对：`utils/constants.ts` 的图片、音视频与压缩包类型，`components/system/Files/FileEntry/extensions.ts` 的文件关联，以及各应用加载器。额外检查 Emulator 的主机核心和 ROM 扩展名、JSDOS 的 EXE/ZIP/JSDOS 加载流程、V86 的镜像类型、OpenType 的字体解析、TinyMCE 的 RTF 导入和 WHTML 保存、Webamp 的 MP3/播放列表/皮肤入口。简介与卡片、详情、搜索共用同一份数据；第三方网页应用的用户自填简介保持原样。

最终文案通过 Next 生产构建、站点资源审计、lint 和 `git diff --check`。浏览器分别确认中英文各有 30 条不同简介，搜索 `.woff` 定位 OpenType、搜索 `.swf` 定位 Ruffle，详情页复用对应简介。中文 390px 视口中全部简介均无横向溢出；英文桌面视口也无横向溢出。现有商店分类和搜索 E2E 检查通过（1 项，8.6 秒），已查看英文卡片截图。文件格式清单来自实现核对，本轮不宣称对每种格式的实际文件完成解码验收。
