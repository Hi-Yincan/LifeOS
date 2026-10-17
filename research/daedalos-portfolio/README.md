# daedalOS 个人作品集研究原型

> 已冻结为研究归档。正式源码位于仓库根目录，当前运行方式见根 README；后续功能只修改正式源码，不同步回此 overlay。原型基线：`f57d30f`。

这是概念验证，不是生产实现。源码 overlay 与内容服务在本目录；完整 daedalOS 在独立临时 checkout 构建，根目录现有站点未修改。

- 本地入口：`http://127.0.0.1:4391`
- 站点名称：`Yincan Huang`；站点名称、地址 `https://hyc.ac`、头像、描述和索引入口共用 `personal-site.json` 配置。
- 基线：`DustinBrett/daedalOS@f017b393d4175eb396a741a7562299423843f1b1`
- 默认直接进入桌面，不自动打开作品集；显式作品集链接仍可打开；设置保留语言选择与单密钥管理入口。2026-10-17 起取消额外手机/平板适配和独立 App 皮肤，全部沿用 daedalOS 原生响应式。
- 管理入口：开始菜单左侧栏 → 系统设置 → 站点维护。密钥在本机忽略目录 `.runtime/key.json` 中；不要提交、截图或粘贴到 Issue。无用户名。
- 公开四个项目；浏览器验证创建的合成项目保持下架，仅管理态可见。

新增 [系统级应用商店研究原型](../../specs/concept/app-store.md)：从桌面或开始菜单的 App Store 进入。28 项系统软件＋作品集与 App Store 两项应用软件；三个分类均未选中时显示全部应用，再次点击已选分类可取消筛选；可添加本机网页应用清单，启停/移除只影响当前浏览器。第三方接入方案尚待评审，未提供代码包执行与站点发布。

## 复现

需 Git、Node 与 Yarn Classic。此次实际环境为 Node 26.7.0、Yarn 1.22.22；上游 CI 的 Node 22 尚未在本轮本机重复测试。正式项目应先锁定并验证统一版本。

```sh
git clone https://github.com/DustinBrett/daedalOS.git /tmp/hi-yincan-daedalos-concept
git -C /tmp/hi-yincan-daedalos-concept checkout f017b393d4175eb396a741a7562299423843f1b1
cd /tmp/hi-yincan-daedalos-concept
yarn install --frozen-lockfile --ignore-scripts
```

回到本仓库根目录执行：

```sh
node research/daedalos-portfolio/tools/prepare.mjs /tmp/hi-yincan-daedalos-concept
```

在本仓库运行干净构建（清理旧输出与缓存、构建、检查站点残留），然后启动：

```sh
node research/daedalos-portfolio/tools/build.mjs /tmp/hi-yincan-daedalos-concept
node research/daedalos-portfolio/tools/start.mjs /tmp/hi-yincan-daedalos-concept/out
node --test research/daedalos-portfolio/test/*.test.mjs
```

没有全局 Yarn 时，可在 `build.mjs` 的 checkout 参数后传入 Yarn Classic 的 `yarn.js` 绝对路径。锁文件来自固定上游提交，不随研究原型修改。

`prepare.mjs` 检查 SHA，复制自有 overlay，并修改 14 个明确列出的上游文件；识别不了的已有改动会拒绝覆盖。这是实验构建工具，**不等于生产 submodule 接入契约**。应用保留和补丁清单见 `evidence/integration-manifest.json`。

## 验证与限制

商店实际验证见 [应用商店报告](../concept/app-store.md)。

系统设置入口见 [OS 设置报告](../concept/sidebar-settings.md)。作品集默认不带设置按钮。

参见 [视觉修订报告](../concept/style-revision.md)；[2026-10-16 历史验证报告](../concept/validation.md)中的 A/B 与自制三模式已作废 与 [概念目录](../../specs/concept/README.md)。本地服务仅绑定 127.0.0.1，浏览器访客隔离测试使用 localhost 主机名；这不代表真实跨域部署已完成。

本地 JSON 存储、内存会话、图片签名检查是测试夹具。生产需要数据库、对象存储、实际图片解码、跨域/HTTPS Cookie、密钥轮换、审计与多节点验证。原型没有资料编辑器、完整媒体画廊、所有公共 OS 菜单翻译、每个作品独立 SEO 元数据。

本地服务提供 COOP/COEP 响应头；静态导出时 Next headers 不生效。不能据此认定 GitHub Pages 上所有重型 App 可用。完整 33 项应用/进程条目保留，但本轮只对代表应用做启动检查。

`browser-evidence.mjs` 使用上游已有的 html-to-image 生成 **DOM 渲染图**；不是原生屏幕截图，也不替代真机测试。研究辅助脚本不作为生产依赖或公开产品功能。

运行状态、会话、口令、上传测试数据、依赖与完整上游 checkout 均不归档。服务停止后，可按上面命令重新启动；会话失效、内容保留。请勿把本地夹具直接暴露到公网。

概念阶段收尾后的复用策略见 [原型交接](../../specs/concept/prototype-handoff.md)。已验证的 UI、交互与业务规则进入正式工程；本地夹具和临时接入方式按计划逐项生产化。

作品集与站点图标复用 blog 内容子模块中的圆形头像。`portfolio.svg` 嵌入同一 PNG，保留已有快捷方式 URL；网站 favicon 固定指向 `avatar.png`，窗口标题仍沿用原生前台应用标题。

## 旧站点资源与缓存清理

清理范围和验证见 [资源清理报告](../concept/site-cleanup.md)。旧 `favicon.ico`、`screenshot.png`、`settings.svg`、重复截图辅助资源和旧 RSS 已退出原型。设置图标与开始菜单共用齿轮路径；分享图片使用圆形头像。`robots.txt` / `sitemap.xml` 由本站配置生成；未实现的 RSS 不再声明。

`build.mjs` 清理 `.next`、`.swc`、`out`、TypeScript 增量文件和旧 `.index` 后重建；成功后保留静态 `out` 与原生文件系统必需的 `.index`，删除构建中间产物。`audit-site.mjs` 扫描运行源码与发布产物，旧作者域名、邮箱或预置公钥回流时失败。不要将运行时索引、第三方依赖文件、用户内容或许可证当作缓存删除。

历史调研文档与证据按原样归档，其中的上游链接是来源记录。当前原型的 `.runtime` 内容、密钥与访客浏览器文件不属于本轮清理对象。
