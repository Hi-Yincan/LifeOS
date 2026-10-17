# 产品调研归档

状态：**2026-10-16 调研收口，项目负责人确认使用 daedalOS 二开。** 下一阶段为 Issue #2 概念／PRD。

协作记录：[R15 最终决议](https://github.com/Hi-Yincan/LifeOS/issues/1#issuecomment-6209307900) · [C01 概念阶段交接](https://github.com/Hi-Yincan/LifeOS/issues/2#issuecomment-6209308484)。

## 阅读顺序

1. [最终选型与阶段决议 D-001 / R15](closeout/decision.md)
2. [概念阶段交接 C01](closeout/concept-handoff.md)
3. [成熟度对照 R14](framework-comparison/README.md)及[指标快照](framework-comparison/evidence-2026-10-16.json)
4. [研究样机与验证 R13](os-validation/README.md)
5. [Issue #1 历史评论归档](archive/product-research.md)

R01–R14 是按时间保留的研究过程；其中“选型未冻结”“首选验证对象”等措辞代表当时状态，当前决定以 R15 为准。ProzillaOS 原型不作为正式产品继续扩展；Puter 不是本项目当前底座。

研究目录没有替换根目录站点。本地实验服务在收尾时已停止，可按样机 README 重新启动。`node_modules/`、`dist/`、`.runtime/` 不属于归档；口令、会话和运行数据不写入报告。研究源码及本地证据随概念交付在独立评审分支归档；协作入口保持为 Issue 评论。

## 概念阶段补充

- [C02｜上游同步与升级要求](maintenance/upstream-sync.md) · [Issue 评论](https://github.com/Hi-Yincan/LifeOS/issues/10#issuecomment-6209599159)。设计建议，尚未配置自动化或引入上游代码；不改变 R15 已确认选型。

- [仓库组织与集成方式：子 Issue #11](https://github.com/Hi-Yincan/LifeOS/issues/11) · [C03 本地报告](maintenance/repository-organization.md)。
- C02 已迁至 [子 Issue #10](https://github.com/Hi-Yincan/LifeOS/issues/10)，父 Issue 只保留目录与迁移指引。

- [#12｜部署架构：hyc.ac 统一入口、国内外节点与 CDN](https://github.com/Hi-Yincan/LifeOS/issues/12) · [C04 本地讨论记录](deployment/discussion.md)。

- [#13｜OS 多语言与地区设置](https://github.com/Hi-Yincan/LifeOS/issues/13) · [C05 本地讨论记录](localization/discussion.md)。

## 作品集概念交付（2026-10-16）

- [完整概念目录](../specs/concept/README.md)
- [真实 daedalOS 研究原型](daedalos-portfolio/README.md)，与历史 ProzillaOS 样机分开。
- [验证报告与设计图](concept/validation.md)
- #15 为 #9 下的原生子 Issue，第一版仅新增作品集，全部原生 App 保留。

本段为后续概念交付；上文的历史样机服务状态不适用于当前 4391 端口的新原型。
