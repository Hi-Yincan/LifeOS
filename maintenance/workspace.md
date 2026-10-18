# 工作区与分支约定

2026-10-17 整理记录。正式开发统一使用主仓库工作区的 main；已合并的集成、概念和发布临时分支已清理。整理前已核验所有工作区没有未提交源码，未合并的演练历史先推送归档标签。

## 保留的引用

| 引用 | 职责 |
| --- | --- |
| main | 唯一正式源码分支 |
| origin/pages-live | 首次 OS 上线前的旧首页历史备份；位于 LifeOS，不能作为开发分支或新发布仓库的 branch source |
| upstream/main | daedalOS 上游跟踪引用，供升级检查；不是本项目的工作分支 |
| archive/upstream-rehearsal-2026-10-17 | 保存真实升级与回退演练的全部提交，最终为 d5672945 |
| deploy/visitor-2026-10-17 | 首次公开 OS 发布版本 86620989 |

两个标签均已推送 origin。已合并的开发提交仍由 main 完整保留，不依赖临时分支继续存在。

## 本地状态

- 注册的 Git worktree 只保留主工作区，当前为 main。
- 已移除额外产品集成与升级演练工作树、验收用干净克隆和两份临时演练产物。
- 产品本地服务的 server/.runtime 与可用预览已迁回主工作区；没有删除密钥或用户内容。
- 原型的运行目录和原型预览保持。运行数据不随代码提交，不能把 Git 历史当作数据备份。

## 后续操作

日常从 main 开发。需要并行开发时使用项目 parallel-development 技能建立有明确任务和所有者的临时 worktree。任务合并后先检查状态和独有提交，再移除 worktree 和临时分支；不能仅凭分支名删除。

未合并但需要保留的实验先归档到明确标签，并确认远端保存成功。pages-live、main 和 upstream 不参与通用批量删除。部署版本保留单独标识，源码清理不改变线上版本或 DNS。

## LifeOS 与发布仓库

2026-10-18 已按职责分开本地目录：

| 本地目录 | origin | 用途 |
| --- | --- | --- |
| `/Users/acccan/Repos/Hi-Yincan/LifeOS` | `Hi-Yincan/LifeOS` | 唯一产品源码；新 Agent 从这里继续开发 |
| `/Users/acccan/Repos/Hi-Yincan/hi-yincan.github.io` | `Hi-Yincan/Hi-Yincan.github.io` | 轻量发布配置；只在准备发布、调整发布流程或回退时使用 |

两个目录是独立 Git 仓库，均使用 main；不是彼此的 worktree，也不使用 submodule。发布配置原先在 `/private/tmp/lifeos-publisher`，已整体移至上述固定目录。

LifeOS 的 Git 历史、node_modules、out 和被忽略的运行数据随原目录整体迁移。4391 原型和 4392 产品本地服务从 LifeOS 新路径恢复；端口和运行数据保持。旧路径现在属于发布仓库，不能继续把它当作产品源码目录。

源码更新不会自动部署。发布仓库仍通过 deployment.json 固定 LifeOS 的完整 SHA；本次本地目录整理不改变线上版本或 DNS。详见 [职责与验收](../specs/deployment/repository-split.md)。
