## R14｜daedalOS 与 ProzillaOS：成熟度复核及验证优先级修正

日期：2026-10-16。关联 Issue #1，承接 R09、R12、R13。状态：研究判断，未冻结生产选型。

### 结论与前版修正

**可以用 daedalOS 二开，而且按目前需求和证据，应将它恢复为首选验证对象；ProzillaOS 为备选，Puter 为需要完整云电脑能力时的条件方案。**

R09 原本就推荐先验证 daedalOS。R13 选择 ProzillaOS 做原型，是因为其独立包、App 类和可组合视图方便隔离验证“OS 外壳＋内容服务”。这只能证明架构可行，不能证明 ProzillaOS 比 daedalOS 更成熟、更省维护。此前没有做对等集成验证，就让原型选择呈现为底座倾向，依据不足。

R13 的权限、发布与图片隔离验证仍有效；它们是独立内容服务的证据，不是 ProzillaOS 独占优势。无需因更换外壳而废弃这些研究成果。

### 1. 同时间点的维护证据

2026-10-16 从两者官方 GitHub API 重新获取；提交窗口为 2026-07-18 00:00 UTC 起至采集时，默认分支结果已分页，不是只看最近 100 条。

| 指标 | daedalOS | ProzillaOS | 解读 |
| --- | --- | --- | --- |
| Star / Fork | 13,056 / 1,201 | 359 / 75 | daedalOS 的关注与复用尝试积累明显更多；Fork 不等于成功生产部署 |
| 仓库创建 | 2020-08-09 | 2023-07-13 | daedalOS 历史更长；不能只凭年限推断代码质量 |
| 默认分支最新提交 | 2026-10-10 | 2026-06-20 | 当前维护连续性 daedalOS 更强；没有提交不等于已停止维护 |
| 近 90 天提交 | 107 | 0 | 同窗口、同分支口径 |
| 最新工作流 | Tests 成功，2026-10-10 | Run checks 成功，2026-06-20 | 都有质量检查；需进一步看覆盖内容 |
| 分发与升级 | 本次 Release API 返回空列表，适合固定 commit 跟进 | 有版本化包与 Release；最新列出的 umbrella Release 为 2.0.5 | ProzillaOS 的包式消费更清晰，但不抵消活动差异；core 2.1.2 与 umbrella 2.0.5 是不同包 |

维护风险也需保留：daedalOS 本窗口 107 次提交全部来自 DustinBrett，不能把高 Star 解释为多人团队保障。ProzillaOS contributors API 返回 8 人，但近期无提交，也不能仅按累计贡献者人数判定其维护更可靠。

数据来源：[daedalOS 仓库 API](https://api.github.com/repos/DustinBrett/daedalOS)、[ProzillaOS 仓库 API](https://api.github.com/repos/prozilla-os/ProzillaOS)、[daedalOS 窗口内提交](https://api.github.com/repos/DustinBrett/daedalOS/commits?since=2026-07-18T00%3A00%3A00Z&per_page=100)、[ProzillaOS 窗口内提交](https://api.github.com/repos/prozilla-os/ProzillaOS/commits?since=2026-07-18T00%3A00%3A00Z&per_page=100)。本地冻结快照：`research/framework-comparison/evidence-2026-10-16.json`。

### 2. daedalOS 的测试证据更贴近要复用的窗口底座

固定 SHA：`f017b393d4175eb396a741a7562299423843f1b1`。

检查了最新 [Tests 工作流实际执行记录](https://github.com/DustinBrett/daedalOS/actions/runs/38066476386)，确认安装依赖、Jest、构建、Oxlint 和 Playwright E2E 各步骤均成功，而不只是发现仓库里有测试文件。

[Playwright 配置](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/playwright.config.ts)覆盖 Chromium、Firefox、WebKit；[窗口测试](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/e2e/components/system/Window.spec.ts)包含最小化、最大化、小视口下窗口行为，另有键盘与可访问性测试。ProzillaOS 的 [checks](https://github.com/prozilla-os/ProzillaOS/blob/c94470a868054b21acf9a8bb0b39fedc9a718591/.github/workflows/checks.yml)主要执行包构建、lint 和单元测试。本次核验的工作流中，daedalOS 的浏览器端覆盖更直接对应本项目要复用的能力。

这是**上游 CI 证据**，不是我已经在本机完成 daedalOS 衣柜原型或证明所有浏览器/手机都无问题。工作流有重试配置，成功也不等于无偶发失败。

### 3. 二开接口核验：没有发现必须排除 daedalOS 的理由

| 本项目要求 | daedalOS 现有支撑 | 仍需要我们实现的部分 |
| --- | --- | --- |
| 博客、衣柜作为原生窗口 App | `contexts/process/directory.ts` 注册动态加载 React 组件、图标、标题、窗口尺寸；`RenderComponent` 将组件包进公共 Window | 新增内容 App 与品牌入口 |
| 同 App 的 visitor/admin 视图 | App 是 React 组件，可访问独立内容 API，不必依赖完整云 OS 账号 | 身份接入、管理视图；所有写入与私有读取由服务端授权 |
| 内容链接 | `useUrlLoader` 已支持 `?app=` / `?url=` 初始化打开应用 | 内容 ID、路径、前进后退及分享契约；不是已有完整博客路由 |
| 静态前端部署 | `next.config.js` 包含 `output: "export"` | 独立内容 API 的部署与认证；静态导出本身不提供管理后端 |
| 减少无关应用 | 应用目录使用动态 import，具备按应用拆分的入口 | 还需盘点开始菜单、文件关联、预加载、构建脚本和静态资源，实际测量裁剪效果 |

关键源码：[应用目录](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/contexts/process/directory.ts)、[公共窗口包装](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/components/system/Apps/RenderComponent.tsx)、[URL 加载器](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/hooks/useUrlLoader.ts)、[构建配置](https://github.com/DustinBrett/daedalOS/blob/f017b393d4175eb396a741a7562299423843f1b1/next.config.js)。

特别注意：现有 `useUrlLoader` 只在初始加载执行，并对 `url` 做文件存在性或特定应用的外部 URL 检查。任意衣物 ID 不能假装成已有文件直接套用；需设计业务路由适配。不能把“已有 URL 参数”写成“内容深链接已经验收”。

### 4. 为什么还保留 ProzillaOS

它的独立 core 包、自定义 App 文档和可组合视图，让“在自己的项目中消费框架”更方便；daedalOS 更接近 fork 完整项目，在项目内部新增 App。前者在接口清晰度上有优势，后者在当前维护、窗口实现积累和上游浏览器回归证据上更有优势。

对于本项目明确提出的“在成熟产品上二开”，后面这些指标应比原型搭建便利性占更大权重。尚无对等运行数据证明 daedalOS 的包体、移动端或升级成本更差，因此不能用未经实测的成本判断把它降到备选。

### 5. 更新后的验证决策

1. **daedalOS：首选验证对象。** 固定上述 SHA，在独立实验目录复用既有合成数据与内容服务，用相同衣柜发布流程验证；保留上游来源与小范围适配。
2. **ProzillaOS：备选及现有可行性样机。** 保留 R13 证据，不继续因已写原型而默认扩展成正式产品。
3. **Puter：条件方案。** 只有明确要复用云文件、通用工作空间等平台能力时，再提高优先级。

daedalOS 下一轮验收门槛是实际构建运行、同 App 管理闭环、公开链接、390px 阅读和管理、无关应用加载量、核心改动清单。当前没有完成该本地集成，因此这里修正的是**验证优先级**，不是提前宣布最终选型或迁移完成。

本轮实际完成：官方指标刷新、完整窗口内提交计数、固定版本源码核验、上游 CI 步骤核验、选型依据纠偏与 Issue 留痕。没有修改 Puter 部署，也没有将研究原型替换为生产站点。
