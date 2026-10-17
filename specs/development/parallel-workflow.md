# 项目级并行开发工作流 v1

2026-10-17 · 关联计划任务 #18、计划阶段 #3、开发阶段 #4。

## 使用入口

主体是 [parallel-development 技能](../../.agents/skills/parallel-development/SKILL.md)。Codex/Cursor 使用项目 `.agents/skills/`；Claude Code 有 [薄入口](../../.claude/skills/parallel-development/SKILL.md)。其他 agent 可直接读主体，无需安装厂商插件或依赖厂商 SDK。

给任何 agent 的启动提示：

> 读取本项目 `.agents/skills/parallel-development/SKILL.md`，以当前原型为基线，按共享协议拆分并执行这个目标。保留我正在做的设计，先给每个写入任务分配独立 worktree 与文件范围。

支持原生技能调用的客户端也可使用 `$parallel-development`；Claude Code 使用 `/parallel-development`。实际发现和调用方式以客户端版本为准。任意工具都能通过 Markdown 任务包＋同一套 Python 命令参加，聊天历史和原生 subagent API 都不作为跨工具协议。

## 一个批次如何运行

需要 Git、Python 3.9+；示例任务还需要 Node.js。Python 脚本只用标准库。先读 [协议与恢复规则](../../.agents/skills/parallel-development/references/protocol.md) 和 [各工具适配方式](../../.agents/skills/parallel-development/references/adapters.md)。

从仓库根目录执行，先按目标调整示例计划的 ID、任务、文件归属和实际门禁：

```sh
python3 .agents/skills/parallel-development/scripts/workflow.py init \
  --plan .agents/skills/parallel-development/assets/prototype-plan.json \
  --batch .parallel/prototype-audit
python3 .agents/skills/parallel-development/scripts/workflow.py prepare \
  --batch .parallel/prototype-audit
python3 .agents/skills/parallel-development/scripts/workflow.py packet \
  --batch .parallel/prototype-audit --task content-audit
```

总控把 packet 交给可用 agent；可用原生并行调用，也可用已授权的 CLI/IDE 会话。没有启动接口的工具保留完整交接包，不虚构自动派发能力。

执行者依次 `claim → 修改并提交 → check → submit`；独立评审者审查后 `review`；唯一集成者按计划顺序 `integrate`。运行状态查看：

```sh
python3 .agents/skills/parallel-development/scripts/workflow.py status --batch .parallel/prototype-audit
python3 .agents/skills/parallel-development/scripts/workflow.py recover --batch .parallel/prototype-audit
```

`prepare` 基于已提交的 HEAD 创建任务和集成分支，不切换当前设计分支，也不复制未提交的设计修改。使用新规格前确认其已进入所选基线；首次安装的技能应与规格一起版本化。每个批次用唯一 ID，修改计划应建新批次。

## 设计取舍

| 层 | 约定 |
| --- | --- |
| 共享核心 | 同一份 SKILL.md、JSON 协议和 Python/Git 实现；Claude 入口只转到主体 |
| 调度 | 一个总控、默认两个写入者；嵌套 Claude/其他子 agent 的写任务也单独领取，计入同一并发预算 |
| 隔离 | 每任务一个 worktree/分支；共用接口、锁文件、入口注册和迁移各有一个所有者；路径冲突检查忽略大小写 |
| 证据 | 门禁命令、退出码、日志、attempt、提交 SHA；修改后必须重新检查，评审只针对该提交 |
| 集成 | 独立 worktree 按 manifest 顺序合并已评审 SHA；组合门禁通过才标 verified；冲突或失败停下 |
| 恢复 | 原子状态、跨进程锁、心跳/租约、显式交接；recover 只观察，过期不自动抢占；重复集成跳过已有提交 |
| 授权 | 不新增工具权限、不自动 push/清理/部署；文件归属是协作校验，沿用宿主沙箱 |
| 兼容边界 | 支持任何能读文件并操作终端的 agent；无终端 agent 交补丁/评审给总控；跨机器走 Git/报告交接，v1 不提供分布式锁或远程执行 |

参考 `Projsyc/claude-boss-workflow@20f7b88ae739e17bb3222e8ad3e085eefc42c406` 的职责分离、worktree-first 和落盘恢复思想；本实现按工具无关协议重新实现，不依赖其 Claude 专用权限或默认项目目录。

## 验证与待扩展部分

自动行为测试：

```sh
python3 .agents/skills/parallel-development/scripts/test_workflow.py
```

覆盖双写入者、重复领取、依赖基线、门禁失败、越界重命名、旧 token、过期接管、评审后变更、重开、冲突保留和恢复/集成幂等性。测试使用临时 Git 仓库，不改当前原型。

独立 agent 的原型演练和证据见 [验证记录](validation/parallel-workflow.md)。工具无关协议与实际多 agent 闭环分开验证；Claude/Cursor 的自动发现、headless 启动、Agent Teams 和多机器执行不能因协议测试通过就宣称实测通过。后续按真实使用需求补充启动适配器，保持共享协议稳定。
