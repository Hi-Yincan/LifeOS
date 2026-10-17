# 并行工作流独立验证记录

2026-10-17 · 项目任务 #18。机器可读结果见 [parallel-workflow-result.json](parallel-workflow-result.json)。

## 结果

共享技能已在两个独立 Codex 执行者与一个总控/评审者之间跑通真实任务闭环：生成 packet → 并行领取 → 独立 worktree 源码审查 → 各自提交 → 门禁 → submit → 独立评审 → 按序集成 → 组合测试。两个写入任务的实际运行时间重叠，文件范围互不重叠。

| 任务 | 独立交付 | 提交 | 结果 |
| --- | --- | --- | --- |
| content-audit | [原型内容服务审查](prototype-content-audit.md) | `9e4c62ad67504d9e58ca83318aa0ae6537b62550` | 自测、范围检查、独立评审、集成均通过 |
| shell-audit | [原型启动/设置/商店审查](prototype-shell-audit.md) | `ed472ff4dd12f9409ec03f855d7fea7cd4f6e3c1` | 自测、范围检查、独立评审、集成均通过 |

每次集成都执行两个原型测试文件，共 12/12 通过。最终集成提交 `e61ce352f9014f5d5f4b4ec266fc6111267876bd` 只在一次性克隆中；未合入当前产品分支、未推送。连续两次 recover 不改状态，再次 integrate 返回 skipped，集成 HEAD 不变。

最终 helper 的 14 项行为测试通过，技能格式检查通过，Python 3.9 语法解析通过。测试覆盖并发重复领取只有一个胜者、并发预算、依赖基线、路径越界/重命名、大小写冲突、失败门禁、过期租约和旧 token、评审后 HEAD 变化、保留成果重开、合并冲突、集成失败重试和幂等性。

## 环境与基线

- macOS，Git 2.39.5（Apple Git-154），Python 3.14.0b3，Node v26.7.0。
- 演练克隆来自概念分支的已提交快照 `f57d30f`；在克隆中加入待测技能后形成基线 `a59eda1f195e2f46d6a3cab574c2fd3f3625095f`。
- 写入范围只有两份独立报告。没有修改业务源码、使用活动服务 runtime、启动用户浏览器或执行生产动作。总控逐份查看报告 diff，并核对相关源码及规格后才批准集成。
- 安装后行为测试针对项目内的最终 helper 再执行；workers 使用同协议的暂存版本，最终集成使用补充了 reopen 与大小写路径检查的版本。最终脚本摘要记在 JSON 中。
- 内容测试最初被沙箱回环限制阻断，按宿主正常授权流程重跑成功；不是把受限环境失败改写为通过。
- 验证期间用户工作区切到 `integration/daedalos-v1` 并继续导入产品源码；演练始终固定在上述克隆基线，本报告不验证那些同期改动。

## 对原型的实际反馈

源码审查记录了四项待处理问题：translations 未知嵌套字段可能随发布输出、数字标题导致 500、旧验证路径仍要求自动打开作品集、注销失败缺少可见错误反馈。前两项由 worker 在隔离临时 HTTP fixture 复现；后两项是源码/文档观察，未宣称浏览器复现。本轮保留报告，未擅自改动当前设计或把原型问题当作已修复。

## 兼容性边界

- 实测的是普通 Markdown/JSON/Git/Python 协议以及当前宿主的两个独立 Codex agent；没有厂商专有接口出现在核心 helper 中。
- Codex/Cursor 的 `.agents/skills/` 与 Claude 的 `.claude/skills/` 路径依据官方文档核对。Claude 使用薄入口指向唯一主体，其他 agent 可以显式读取主体和 packet。
- Claude Code / Cursor 原生技能发现、headless 启动、Agent Teams、跨机器执行、Windows/Linux 和 Python 3.9 运行时尚未实测。Python 3.9 语法通过不替代 3.9 上的完整执行。
- 没有测量串行基线或 provider token 费用，因此不声明加速倍数或成本收益。没有做浏览器/真机、完整 upstream build、发布或生产验证。

## 下一轮使用

可直接让任意 coding agent 读取项目技能，针对一个已确定的原型/产品目标生成新批次。先把所需规格与技能纳入版本化基线，再分配 owned 文件、依赖、真实 gate 和独立运行资源。优先在实际使用的 Claude Code/Cursor 客户端中验证发现与任务包交接；若需要自动启动，新增薄适配器并独立测试，不改共享协议为某个工具专用格式。
