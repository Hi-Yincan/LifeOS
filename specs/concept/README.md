# 概念阶段交付目录

2026-10-16 · v1.0 · 状态：概念交付稿，待负责人统一评审。正式开发和生产发布尚未开始。

第一版只新增一个业务 App：**个人作品集**。全部 daedalOS 原生 App 保留；作品集建立后续 App 的 UI 参考。设置、多语言、三端导航属于系统支撑能力。

协作入口：[概念阶段 #2](https://github.com/Hi-Yincan/Hi-Yincan.github.io/issues/2) · [作品集 #15](https://github.com/Hi-Yincan/Hi-Yincan.github.io/issues/15) · [草稿 PR #16](https://github.com/Hi-Yincan/Hi-Yincan.github.io/pull/16)。详细报告在 Issue 评论，主体保留目录；完整发布记录见 [issue-record.json](../../research/concept/issue-record.json)。

| 交付 | 内容 |
| --- | --- |
| [PRD](PRD.md) | 产品范围、12 个用户故事、成功标准和阶段边界 |
| [内容与权限](data-and-permissions.md) | 双语字段、草稿/发布快照、媒体、单密钥会话 |
| [用户流程与状态](flows-and-states.md) | 浏览、管理、窗口、语言和三端流程 |
| [UI 规范](design-system.md) | 原生工作台 A / 现代陈列 B、组件模式和视觉规则 |
| [架构决策](architecture-decisions.md) | 上游接入、仓库、部署、权限和设备策略 |
| [验收矩阵](acceptance.md) | A01–A18，区分要求与实测证据 |
| [计划输入](implementation-plan.md) | T01–T15、M0–M4，供 Issue #3 拆解 |
| [资料来源](sources.md) | 个人资料、项目归属、参考与上游基线 |
| [验证报告](../../research/concept/validation.md) | 构建、测试、浏览器证据与原型限制 |
| [运行原型](../../research/daedalos-portfolio/README.md) | 真实 daedalOS 中的作品集与本地管理服务 |

## 统一评审事项

1. 视觉：建议 B 现代陈列作为默认，A 原生工作台作为工具型 App 参考；两套都可在设置切换。
2. 仓库：建议 v1 用保留上游历史的产品集成分支，待模板复用需求明确后再拆底座仓库。尚未替负责人批准最终仓库拓扑。
3. 内容：初始四个项目来自公开 GitHub 主页。具体个人贡献、专业、履历、技能熟练度和真实项目媒体尚缺；不影响概念交付，公开前需核验。

已确认的底座、只新增一个业务 App、原生 App 全保留、单密钥管理、中英双语、三端浏览和 hyc.ac 入口不需重复询问。缺失个人资料未编造；新增业务仍在后续需求池。
