# 概念阶段交付目录

2026-10-17 · v1.4 · 状态：概念设计收尾，准备进入计划阶段。仓库集成已由 #21 启动，生产能力补齐和生产发布尚未完成。

**当前决定（2026-10-18）：** LifeOS 取消管理员身份与全部站点内容管理能力，所有人读取同一展示数据，内容维护转到独立信息源。当前规范见 [内容读取边界](data-and-permissions.md) 与 [可行性报告](../architecture/source-managed-content.md)。目录中旧 PRD、流程、架构与验收的单密钥登录和 App 内编辑条款已被此决定替代；历史报告保留，不作为恢复功能的依据。代码和发布现状需通过实际提交及 `release.json` 核验。

第一版以 **个人作品集** 为首个业务 App，另新增 **系统级应用商店研究原型 #19**。全部 daedalOS 原生 App 保留；作品集建立后续 App 的 UI 参考。设置和多语言属于系统支撑能力；响应式完全沿用 daedalOS。

协作入口：[概念阶段 #2](https://github.com/Hi-Yincan/LifeOS/issues/2) · [作品集 #15](https://github.com/Hi-Yincan/LifeOS/issues/15) · [系统设置 #17](https://github.com/Hi-Yincan/LifeOS/issues/17) · [草稿 PR #16](https://github.com/Hi-Yincan/LifeOS/pull/16)。详细报告在 Issue 评论，主体保留目录；完整发布记录见 [issue-record.json](../../research/concept/issue-record.json)。

| 交付 | 内容 |
| --- | --- |
| [PRD](PRD.md) | 产品范围、作品集与商店用户流程、成功标准和阶段边界 |
| [商店三分类与取消筛选](../../research/concept/app-store-categories.md) | 系统软件 / 应用软件 / 第三方；App Store 自身归入应用软件 |
| [应用商店](app-store.md) | 原生 / 二开 / 第三方应用目录、本机管理实验与待决项 |
| [系统设置](system-settings.md) | 开始菜单左侧栏→系统设置；应用默认无设置按钮 |
| [内容读取与信息源管理](data-and-permissions.md) | 双语展示字段、统一读取、媒体边界与退役接口 |
| [独立信息源管理报告](../architecture/source-managed-content.md) | 本轮删除范围、共用数据源可行性、方案与后续条件 |
| [用户流程与状态](flows-and-states.md) | 浏览、管理、窗口、语言与上游响应式 |
| [UI 规范](design-system.md) | daedalOS 一致的应用视觉、复用控件与内容规则 |
| [架构决策](architecture-decisions.md) | 上游接入、仓库、部署、权限和设备策略 |
| [验收矩阵](acceptance.md) | A01–A21，区分要求与实测证据 |
| [旧站点资源与缓存清理](../../research/concept/site-cleanup.md) | 身份配置、旧资源退役、干净构建与残留检查 |
| [头像与网站图标](../../research/concept/avatar-icons.md) | 复用 blog 圆形头像、作品集入口与固定 favicon |
| [桌面商店入口与交接验证](../../research/concept/desktop-store-and-handoff.md) | 桌面快捷方式、单实例恢复及阶段收尾记录 |
| [Messenger 联系能力核验](../../research/concept/messenger-review.md) | Nostr 身份、收信条件与提醒边界；#20 按负责人要求暂缓 |
| [原型复用与阶段交接](prototype-handoff.md) | 可复用资产、生产化替换项及下一阶段顺序 |
| [计划输入](implementation-plan.md) | T01–T16、M0–M4，供 Issue #3 拆解 |
| [资料来源](sources.md) | 个人资料、项目归属、参考与上游基线 |
| [商店顶部布局修复](../../research/concept/app-store-layout.md) | 地址栏重叠、工具栏边界与窄屏可读性专项回归 |
| [商店原型验证](../../research/concept/app-store.md) | 分类/启动、本机清单、语言与实际验证证据 |
| [OS 设置入口验证](../../research/concept/sidebar-settings.md) | 开始菜单左侧栏入口、应用入口移除与验证 |
| [视觉修订报告](../../research/concept/style-revision.md) | 取消额外适配、视觉统一、构建和浏览器验证 |
| [历史验证](../../research/concept/validation.md) | 2026-10-16 记录，旧视觉与三模式已作废 |
| [运行原型](../../research/daedalos-portfolio/README.md) | 真实 daedalOS 中的作品集与本地管理服务 |

## 计划阶段需明确的事项

1. 视觉：负责人已认可新版原生视觉方向。旧 A/B 和额外手机/平板适配作废；系统设置归 OS，从开始菜单左侧栏独立按钮进入，应用默认无设置按钮。
2. 仓库：负责人已确认单仓产品集成，保留上游历史；当前不建额外 fork/模板仓库、不用 submodule。正式源码与验收见 #21 和 [单仓 ADR](../architecture/repository.md)。
3. 内容：初始四个项目来自公开 GitHub 主页。具体个人贡献、专业、履历、技能熟练度和真实项目媒体尚缺；不影响概念交付，公开前需核验。

已确认的底座、作品集优先与商店新增范围、原生 App 全保留、中英双语、三端浏览和 hyc.ac 入口不需重复询问。站点内容维护使用上述独立信息源方向。缺失个人资料未编造；新增业务仍在后续需求池。
