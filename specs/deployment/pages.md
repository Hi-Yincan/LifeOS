# Pages 访客版发布

2026-10-17 首次发布 · 实施 #23，架构 #12。2026-10-18 更新源码边界：LifeOS 已取消管理员功能，后续维护内容由独立信息源承担。本文件更新不代表任务分支已部署；线上版本以发布仓库与 `release.json` 为准。

## 发布范围

- 默认桌面、全部原生进程、作品集、App Store、系统设置及中英语言保留。
- 作品集由构建期公共字段白名单生成静态 JSON，只选 published=true；排除草稿、私有备注、版本和本地运行数据。
- 设置只保留语言与时区，无维护入口、密码表单或 `/api/session` 请求。本地默认构建也仅提供公开内容读取；两种模式的浏览内容不随站长身份改变。
- 内容来自仓库中已提交的 server/content/seed.json；修改后走源码 PR 和新发布。server/.runtime 和原型运行目录绝不参与构建。
- 有本地 imageId 的作品必须先明确发布媒体，构建拒绝静默导出失效或私有图片链接。

## 构建与发布

GitHub Pages 使用 Actions 发布模式，自定义域名继续为 hyc.ac，DNS 不变。

1. 源码进入 main，Product checks 通过。
2. 在 `Hi-Yincan/Hi-Yincan.github.io` 发布仓库更新 `deployment.json`，固定 `Hi-Yincan/LifeOS` 的完整提交 SHA。手动运行 Publish visitor OS（deploy.yml）；仅接受发布仓库 main，不自动发布普通 push 或 PR。
3. 锁定 Node/Yarn 安装后执行 `node scripts/product/build.mjs --public`，先生成文件系统/图标索引与产物，再执行依赖这些索引的 lint、单元和服务测试。
4. 对真实静态文件服务器执行浏览器验收（需要 Python 3）：

```sh
PUBLIC_DEPLOYMENT=1 yarn playwright test --config=playwright.public.config.ts
```

5. upload-pages-artifact 明确 include-hidden-files: true，保留必要的 .index；仅上传 out，不上传整个仓库。构建检查必需索引、公开快照、无 runtime/API/private 目录、无符号链接和小于 1 GiB。
6. deploy-pages 使用短期 GitHub OIDC 权限部署同一份已验证产物。release.json 记录源码完整 SHA、模式、构建时间和体积，并由发布工作流追加发布仓库与配置 SHA。
7. 核验线上 release.json、首页/头像、作品详情、商店、设置、原生 App、.index 和现有项目路径；具体结果写 Issue 评论。

发布产物保留 30 天；源码、Issues 和升级历史在 LifeOS，发布配置在组织 Pages 仓库，详见 [仓库拆分决策](repository-split.md)。

## 回退

在发布仓库将 `deployment.json` 改回已验证的 LifeOS 完整 SHA，提交 main 后手动执行发布工作流。支持选择只验证构建而不部署；生产部署仍须所有检查通过。首次 OS 发布的源码为 `86620989ec6446ab55aba0a16c237a200254bfb1`，已保留 `deploy/visitor-2026-10-17` 标签。

检查线上 `release.json`、`/blog/`、`/gallery/`，不改 DNS，不强推 main。

旧首页 `pages-live` 分支固定为 `f40bf4060ae081e6ed9f16ce556a83967ef922f1`，仅保留在 LifeOS 作历史备份。发布仓库没有此分支，不能再执行旧的原地切换 branch-source 命令；如需恢复旧首页，须显式准备该静态产物并在发布仓库部署。

## 本次不覆盖

Pages 不执行内容服务。独立管理端、鉴权写 API、数据存储与采集任务需另行实现；LifeOS 可继续留在 Pages，通过后续约定的公开快照或只读 API 获取内容，方案见 [信息源管理报告](../architecture/source-managed-content.md)。当前仍使用构建期作品快照和看板合成数据，没有接入新数据源。

构建器中的 Next headers 对静态导出不生效，Pages 没有本项目配置的 COOP/COEP 响应头；需要跨源隔离/SharedArrayBuffer 的重型原生功能，以及依赖外部服务、跨域许可或账户的功能，不承诺完整可用。保留全部 App 不等于验证了它们全部功能。

手机/iPad 沿用上游布局；本次不另建移动皮肤。国内外真实网络及真机覆盖仍在 #12/#14 后续验收中。
