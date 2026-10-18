# GitHub 作品归类与精选调整

2026-10-18，关联 #15。用户要求自动归类 `HuangYincan` 的作品，并从精选作品中移除 Multica。

## 归类依据

通过 GitHub REST API 核验 18 个公开仓库、个人主页 README 中列出的 AIPM，以及各仓库 README；对 fork 核对默认分支相对上游的差异。分类属于基于公开用途的编辑判断：完整业务平台和知识站归入产品，具体任务的应用与接口归入工具，上游项目参与或维护分支归入贡献，创意、硬件资料、个人规范和展示配置归入其他。

| 分类 | 作品 | 公开依据与归属边界 |
| --- | --- | --- |
| 产品 | [AIPM](https://github.com/AI-PM-Wiki/AIPM) | 个人主页 Projects 列出；AI 产品管理知识站 |
| 产品 | [JobMap](https://github.com/HuangYincan/JobMap) | 地图岗位探索应用；保留仓库说明中的修复状态 |
| 工具 | [VideoNote-MCP](https://github.com/HuangYincan/VideoNote-MCP) | 视频转文字与笔记的 MCP 工具 |
| 工具 | [ocrsnip](https://github.com/HuangYincan/ocrsnip) | macOS 截图、OCR 与置顶工具 |
| 工具 | [BililiveRecorder GUI](https://github.com/HuangYincan/BililiveRecorder-GUI) | Tauri 桌面封装；录制核心与 WebUI 来自上游 |
| 工具 | [EPay Observer Android](https://github.com/HuangYincan/epay-observer-android) | 通知采集原型；明确保留合成测试与真实收款未验证的边界 |
| 工具 | [Neptune Aircon Client](https://github.com/HuangYincan/neptune-aircon-client) | 非官方 Python 客户端；保留已验证范围说明 |
| 贡献 | [Agentero](https://github.com/poco-ai/Agentero) | 个人主页 Contributed To 列出；未推断具体个人贡献 |
| 贡献 | [Multica](https://github.com/multica-ai/multica) | 个人主页 Contributed To 列出；取消精选，保留作品入口 |
| 贡献 | [FanFan](https://github.com/HuangYincan/fanfan) | fork 的 `8053fe24332aba4e049fb56779679aea16f2a990` 记录系统风扇控制恢复重试修复；未声称上游接收 |
| 贡献 | [epay-go](https://github.com/HuangYincan/epay-go) | 相对 zengxiang1/epay-go 默认分支领先 67 个提交；公开提交记录账本修复与观察器链路，不宣称生产收款可用 |
| 贡献 | [ARIS 地学扩展](https://github.com/HuangYincan/Auto-claude-code-research-in-sleep) | fork 相对上游有 10 个独立提交；`d2d5241cc18dc2196810a3b7d0f5b459f4139136` 等记录地学、QGIS 与审查扩展 |
| 其他 | [竖置硬盘电源挂架](https://github.com/HuangYincan/vertical-hdd-power-mount) | STL、FreeCAD、Blender 设计资料与动画 |
| 其他 | [idea](https://github.com/HuangYincan/idea) | 产品构想；不呈现为已交付应用 |
| 其他 | [AGENTS.md](https://github.com/HuangYincan/AGENTS.md) | 基于 Da1sypetals/AGENTS.md 的个人规范，独立修改提交为 `e005a25a617c82ada50ab693e983fa32ff1e47bd` |
| 其他 | [GitHub Stats](https://github.com/HuangYincan/github-stats) | README 指向 jstrieb/github-stats；作为个人展示配置收录，不因 GitHub 的 fork=false 标记而主张原创 |

未重复收录个人主页仓库 HuangYincan；andrej-karpathy-skills 与上游相同，AutoEmailSender 默认分支没有独立提交，本轮也没有从主页找到二者的贡献声明，因此不将它们列为个人作品。该决定不等于断言用户从未参与这些项目。

种子内容的 source 指向公开依据。未读取私有仓库、个人运行数据或私有媒体作为作品来源；未导入 README 中的图片。双语文案为依据以上公开资料整理的摘要。

## 精选与完整作品

`featured` 是与分类、发布状态独立的布尔字段。仅显式为 true 的公开作品进入精选；未设置时不自动精选。AIPM、VideoNote-MCP、Agentero 为精选，其他条目为 false。完整作品和分类筛选仍展示全部已发布条目。

本地 API 与静态导出均通过公开字段白名单输出 featured。服务端验证它必须为布尔值；修改草稿后需要发布才影响访客快照。精选标题数量按精选列表计算，作品总数仍为完整列表数量。

## 验证与预览

- 静态访客版构建、资源审计、lint、30 项单元测试及 15 项服务测试通过。服务测试包括分类分布、精选名单、featured 类型拒绝，以及取消精选只在发布后改变访客快照。
- 静态浏览器回归 9 项通过、1 项按模式跳过：覆盖 16 项公开内容、三项精选、Multica 在贡献分类可见、分类切换/取消/搜索、桌面启动规则、系统设置、Paint 与文件浏览器。跳过项为静态站不支持的管理员写入流程。
- 本地完整 API 构建与资源审计通过，产品浏览器回归 8 项全部通过，包括真实管理会话、编辑、保存草稿、发布和下架。4397 公开 API 实测返回分类数量 2/5/5/4，精选 ID 为 aipm、videonote、agentero，Multica 的 featured=false 且 kind=contribution。
- 公开源码与 README 用于归类和描述；没有将各作品的功能说明当作在本次任务中运行验证的结果。
- 验收期间任务预览使用 4397。原 `server/.runtime/data` 保留；新种子内容使用 `server/.runtime/classified-github-2026-10-18`，管理密钥沿用本任务原有密钥，未写入日志。清理时停止该预览，并将任务运行数据备份到主工作区的忽略目录，不纳入 Git。
- 2026-10-18 用户验收通过，并授权提交、合入本地与远程 main 及清理任务资源。本次未执行生产发布；现有 4391、4392 预览及其他任务不变。
- 本轮未重做截图视觉验收及真机验证；首轮截图接口超时的限制仍适用。
