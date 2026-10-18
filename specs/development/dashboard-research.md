# 综合看板实施前调研与交接

2026-10-18（UTC）。目标：按用户要求，先详尽研究个人状况、会员、自建服务、服务器探针及LifeOS平台接入，完善关联Issue，再启动独立产品开发阶段。此交付属于研究、规格和任务准备；没有修改产品源码或完成业务实现。

## 交付入口

- [综合PRD](../dashboard/README.md)：一个Dashboard、五视图、用户流程、范围与分期。
- [架构/隐私契约](../dashboard/architecture.md)：领域、来源、时间/金额、公开投影、模式与运行边界。
- [验收](../dashboard/acceptance.md)：统一20项、连接器/运行8项及各专题矩阵。
- [实施顺序](../dashboard/implementation.md)：共享契约先行，消除P0/B0循环依赖与共享文件竞争。

| 专题 | 本地文档 | 已发布研究评论 |
| --- | --- | --- |
| 个人活动、位置、健康 | [personal](../research/dashboard/personal.md) | [#37研究](https://github.com/Hi-Yincan/LifeOS/issues/37#issuecomment-6245029537) |
| 会员 | [memberships](../research/dashboard/memberships.md) | [#27研究](https://github.com/Hi-Yincan/LifeOS/issues/27#issuecomment-6245029983) |
| 服务目录与可用性 | [services](../research/dashboard/services.md) | [#32服务研究](https://github.com/Hi-Yincan/LifeOS/issues/32#issuecomment-6245030379) |
| 服务器探针 | [probes](../research/dashboard/probes.md) | [#32探针研究](https://github.com/Hi-Yincan/LifeOS/issues/32#issuecomment-6245030821) |
| LifeOS平台 | [platform](../research/dashboard/platform.md) | [#36平台研究](https://github.com/Hi-Yincan/LifeOS/issues/36#issuecomment-6245031234) |

idea仓库保留历史并增加实施衔接：[会员idea#4](https://github.com/HuangYincan/idea/issues/4#issuecomment-6245031629)、[服务idea#9](https://github.com/HuangYincan/idea/issues/9#issuecomment-6245032034)。没有删除旧研究或用户关于独立产品价值的判断。

## 并行协议与证据

仓库 `Hi-Yincan/LifeOS`，初始main与远端均为 `dba64cb0181bde7e8dc1f1610263d9a2c6983267`，工作区干净。另有 #31 的本地导出工作树及4391/4392活动预览；本批次采用 `parallel-development` 的独立worker/integration worktree，不修改它们或读取运行数据。

批次 `dashboard-research-20261018`，最多5个同时写入任务，另有真正独立的只读审查Agent。协调者唯一写Issue与集成；五个实施者各自claim、提交指定文档、check、submit后停止写入。所有研究报告已审查并按计划顺序合入集成树，综合规格另由协调者claim后编写并独立审查。

| 任务 | 经审查提交 | 审查结果 |
| --- | --- | --- |
| personal | `9311ce4dbe9e8c7aff8afe754e12d378f128a7f7` | 通过；抽查HealthKit官方说明、wger固定模型 |
| memberships | `1bd6088d0df0f8835d1dda765621853486896577` | 通过；抽查Wallos日期/汇率路径与SubTrackr状态 |
| services | `5fd216e91637ae2d8047320b24264defccf4672c` | 通过；抽查UptimeFlare API、worker和官方安全公告 |
| probes | `ae6f3800ef73c12e6cd33c5f11c2b69ea74c4770` | 原稿静态撤回承诺被拒，修订后通过；Komari/Nezha权限源码抽查 |
| platform | `66082ab7c16cbb27d98ce5de759a410d7e41605f` | 通过；核对当前源码、#31、时间/缓存/同源边界 |

综合稿审查补齐：401时清查询缓存但保留隔离内存草稿；日历月遇DST缺失/重复时刻的消歧；已授权source的持续Observation自动按已发布政策投影。专题的候选建议由综合架构明确收敛，不能把两套时间建议混当实现规范。

文档门禁仅检查文件存在/体积与diff；质量结论来自独立全文/diff审查及一手来源抽查。工具日志、lease和本地快照放在忽略的 `.parallel/`；本文件只保存交付必要的脱敏证据，不包含密钥、个人健康数据或会员账户。

## 重要结论

1. 一个OS原生应用可以统一入口、来源和公开政策，领域事实仍需独立：会员权益/计划/实付，服务可用性/主机资源，测量时间/抓取时间不能合并。
2. 优先参考成熟规则与只读API，不引入另一套完整看板UI。现有主机监控优先接入；UptimeFlare是用户已指定的首候选，但不是已部署事实。
3. Wallos存在不同日期算法路径，续期不是实付凭证；缺汇率不能把原数值混入目标币种。新模型统一排期与来源解释。
4. UptimeFlare页面隐藏不会等于API授权，摘要不提供逐项测量时间/公开历史；新鲜度要考虑持久化周期，探测基础设施故障不冒充目标down。
5. 设备健康数据需平台桥接，来源采样/后台上传/服务器刷新分别验证；Fasten OnPrem已归档，不宜作为新的常在线默认后端。
6. 静态Pages无法强制收回公开副本。自动延迟/过期/撤回的敏感数据需要动态可信出口，当前保持#31本地编辑/导出流程。

## Issue组织与发布状态

保留 #9→#36→#27/#37/#32 的既有原生层级。新增并关联：

| Issue | 父Issue | 内容 |
| --- | --- | --- |
| #38 | #36 | 原生框架、统一契约、OS接入 |
| #39 | #36 | 逐项公开、时间窗与隐私投影 |
| #40 | #36 | 常在线采集、持久化、恢复 |
| #41 | #32 | 服务目录、独立可用性与适配 |
| #42 | #32 | 服务器只读探针与指标 |
| #43 | #37 | 活动、日程、位置与轨迹 |
| #44 | #37 | 健康、检查记录与设备桥接 |
| #45 | #36 | 待处理事项、事件与可靠提醒 |

发布前保存原Issue正文/评论快照；每次更新前核对没有新的外部修改；逐项记录新Issue、原生关联和评论URL，防止重复创建。父Issue保留目录，研究全文和最终收敛契约放评论，子Issue包含职责、依赖和可观察验收。所有实施Issue保持开放，未将研究完成作为产品完成。

最终回读通过：15份正文（7个既有Issue和8个新任务）、8条报告评论（五专题、两个idea衔接和一个综合契约）、8个新原生父子关系与预期一致；没有占位符。统一契约已发布在 [#36最终实施规格](https://github.com/Hi-Yincan/LifeOS/issues/36#issuecomment-6245050075)。本地报告和源码不因写Issue而推送或部署。

## 实际验证与限制

已执行五研究任务的文档检查、独立审查与集成diff检查；平台专题检查41处源码行引用及UTC/Asia-Shanghai时间例。综合5份文档的30个本地链接、无占位符、日历/滚动/DST/月末/闰年例与 `git diff --check` 均通过；这些是规格一致性检查，不是产品测试。

协调者通过ego-browser实际访问Gx404公开页，测试iCloud搜索及排序选项/名称排序，并检查页面说明的缺失汇率排除；没有登录后台或核验通知/支付。截图捕获超时，未将截图作为视觉验收证据；浏览器任务空间已关闭。网页检索工具本次未返回正文，外部技术事实来自正常授权读取的GitHub API/固定源码/官方文档。

本次没有运行产品构建、业务测试、竞品端到端、真实穿戴设备、服务器探针、通知发送或生产验收，因为没有产品源码变更。各实施验收表仍是待执行要求。未复制第三方UI/源码/图片，未安装agent、改DNS或部署。

## 下一阶段入口

先从 #38 的共享契约子步骤开始，经独立审查后，再划分原生框架、#39投影/本地服务、#27会员和#41目录的独立所有者。当前仍缺实际设备/日历/服务/探针、时区/公开范围/保留期及运行资源/通知渠道，已询问用户；不阻塞基础框架和本地确定性逻辑，阻止对应真实接入和发布承诺。

本批次仅在独立 `parallel/dashboard-research-20261018/integration` 保留交付。main未被本任务修改；未执行Git推送、合入main或生产发布。尚未安全交付到main，因此保留任务分支/worktree，不适用合并后清理。本任务未启停4391/4392，也未覆盖预览out、运行数据或#31工作区；交接时服务实际状态另按本机监听结果报告，不把开始时的进程视为持续未变。
