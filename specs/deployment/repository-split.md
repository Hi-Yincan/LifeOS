# LifeOS 源码与 Pages 发布职责

2026-10-17 用户确认。跟踪：#11 仓库组织、#12 部署架构。

## 决策

- 将原 `Hi-Yincan/Hi-Yincan.github.io` 改名为 `Hi-Yincan/LifeOS`，保留仓库身份、提交、Issues、PR、标签、上游 ancestry。它仍是完整个人产品的唯一源码仓库。
- 新建 `Hi-Yincan/Hi-Yincan.github.io`，作为组织 Pages 入口，保存 `deployment.json`、发布工作流与说明。
- 发布配置使用固定的 LifeOS 完整 40 位提交 SHA。CI 临时检出源码并构建，不采用模板、Git submodule、移动 main 或复制源码来同步。
- LifeOS 保留 Product checks 和上游检查，移除直接生产部署工作流。发布仓库仅手动发布 main 中已提交的版本配置；普通源码 push 不触发上线。
- hyc.ac 及现有 DNS 不变；发布仓库持有 Pages 自定义域名，保持 blog/gallery 项目站的路径关系。

## 发布与责任边界

发布工作流验证配置，检出精确源码，安装固定 Node/Yarn，按原有标准完成访客构建、lint、单元/服务/浏览器测试，仅上传 `out/`。Pages 权限只给予部署 job，构建 job 只有 contents:read；读取公开 LifeOS 不需要额外的长期 token。

`release.json` 保留 LifeOS SHA，并追加发布仓库及其配置 SHA，便于从网页反查两个版本。发布流程可选择只验证构建而不部署；构建失败不替换线上站点。

管理员服务、数据和密钥均不进入发布仓库。生产仍为访客静态版；本地管理服务与现有原型不受本次仓库拆分影响。

## 回退与链接

版本回退：在发布仓库将 deployment.json 恢复为已验证的源码 SHA，提交后手动发布。产物保留 30 天；迁移前的已发布产物另行保存于本机迁移目录，不应依赖过期的 Actions 产物作为长期备份。

旧首页的 `pages-live` 分支保留在 LifeOS 作为历史备份，不再是发布仓库的分支；旧的 source[branch]=pages-live 原地回退命令不再适用。

重新使用旧仓库名会终止旧 GitHub 地址到 LifeOS 的自动重定向。迁移修正当前文档和可编辑的 Issue/PR 正文、评论中指向旧仓库的链接；旧提交内容及外部收藏无法统一修复。历史证据文件仅校正仓库 URL，原始提交、结果与运行 ID 不变。

## 本地工作区

2026-10-18 已按用户要求分开本地目录：源码位于 `/Users/acccan/Repos/Hi-Yincan/LifeOS`，轻量发布仓库位于 `/Users/acccan/Repos/Hi-Yincan/hi-yincan.github.io`。两者是独立仓库，origin 分别对应各自远程。源码从旧目录整体迁移，保留原型、依赖和运行数据，并从新路径恢复本地预览；发布配置从原临时目录整体迁入固定位置。日常开发只打开 LifeOS，发布时才操作 hi-yincan.github.io。2026-10-17 验收 JSON 中的路径保留为当日历史快照，当前路径以本文和 maintenance/workspace.md 为准。

## 验收

- 原仓库 ID、Issues/PR 数量、原有分支和标签保留；LifeOS main 与本地同步。
- 新发布仓库仅含配置、工作流和说明；无应用源码、密钥、运行数据或 submodule。
- 发布 CI 全部检查通过，release.json 可反查源码 SHA 与配置 SHA。
- hyc.ac HTTPS 可访问，blog/gallery 内容与迁移前一致；必要的静态索引和作品集数据可访问。
- LifeOS 不再拥有生产 Pages；生产域名归发布仓库管理。

## 实施结果

迁移已完成，详见 #26 的验收评论和 [机器可读记录](../../maintenance/deployment/2026-10-17-repository-split.json)。线上锁定源码 `1144f2a4bd55c1ea7463c2a81021c99f6afc6b9b`，发布配置 `a8681b9722a3687833db126ecf562e38883e306a`。此后的维护验收文档提交不触发重新发布。

LifeOS 的产品 CI 与发布仓库的访客构建/验收均通过。新仓库现持有 hyc.ac 的 Pages 配置，HTTPS 强制开启；LifeOS 的 Pages 已关闭。blog/gallery 内容 SHA-256 与切换前一致，原 25 个 Issue/PR 和 80 条评论均保留，54 处正文/评论链接已修复。
