# 上游维护

当前采用单产品仓库，不创建模板仓库或 submodule。`baseline.json` 是当前实际采用的上游 SHA，不能用移动的 main 或 package 版本替代。Node/Yarn 与原始锁文件哈希一起记录。`upstreamLockSha256` 对 Git blob 计算（`git show <SHA>:yarn.lock`），不对受 eol=crlf 影响的工作区字节计算。

## 首次集成与职责

`14066967` 是双父合并基线：保留原仓库 `f57d30f` 和上游 `f017b393` 两边历史；唯一合并冲突为 `.gitignore`，按两边保留规则处理。后续产品差异作为正常提交维护，不再由字符串替换生成。

前端源码在根目录；本地内容服务在 server。原型仅留作研究归档，禁止在 overlay 和产品目录双写功能。每次改动根据 Issue 更新规格与回归。

## 升级步骤

1. 新克隆添加 `upstream`：`git remote add upstream https://github.com/DustinBrett/daedalOS.git`。已有远端应核对地址，不能覆盖未知远端。
2. `git fetch --no-tags upstream main`，选择并固定目标的完整 SHA。`yarn upstream:check` 只读检查最新提交；`yarn upstream:check <完整目标 SHA>` 输出差异及与产品改动重叠的文件。
3. 创建升级 Issue 和 `upgrade/daedalos-<短SHA>` 分支，记录当前/目标 SHA、原因、依赖与自有改动风险。
4. 用普通 merge 合并目标，不 squash 上游 ancestry，不 rebase 已发布产品历史。逐项审查冲突、资源删除、身份配置、App 注册和构建配置；无 Git 冲突不代表行为正确。
5. 更新 baseline 的 SHA 与原始上游锁文件哈希；上游依赖变更须保持其锁文件一致，避免无关升级。
6. 在干净克隆安装锁定依赖并运行 build、lint、unit、server、product E2E；按差异扩大到上游 E2E、原生 App、真机和网络回归，列明未覆盖项。
7. 独立升级 PR 通过评审后才能进入发布版本；保留旧提交和不可变产物。CI 不自动 merge 或部署。

## 回退

发布前保留上一版产物与精确提交。失败的候选停留在升级分支，不修改线上。已发布后回退前端应重新选择上一版构建产物；Git 上保留合并历史，用明确的回退提交而非强推。回退 merge 后，其上游提交仍在 ancestry 中；恢复该版本时需显式评审“回退该回退提交”或重应用修复，不能期待再次 merge 同一 SHA 自动恢复代码。数据库/内容迁移需要单独验证向后兼容、备份和恢复；切前端版本不等于恢复数据。

## 检查节奏与权限

工作流每周一只读比较上游 HEAD，并将结果写入 Actions 摘要，也支持手动运行。工作流进入默认分支后定时检查才会生效；当前草稿分支不代表已启用计划任务。不会自动创建升级提交、合并或发布。相关紧急修复应单独评估，不等待周期。

产品差异见 [changes.md](changes.md)，干净克隆、两版本升级与回退证据见 [2026-10-17 验收](evidence/2026-10-17/README.md)。未完成验证的内容不得标为通过。代码、数据库、媒体与密钥的备份分别管理。
