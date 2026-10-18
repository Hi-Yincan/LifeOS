# 旧站点资源、身份配置与缓存清理

2026-10-17 · 概念 Issue #2 · 当前运行原型清理，历史调研按原时间保留。

## 根因与范围

之前只替换了标签页名称和头像，上游 `PACKAGE_DATA`、包作者字段、Open Graph URL/图片、默认书签，以及 robots/RSS 构建脚本仍使用旧作者身份。直接删生成文件会在下次构建恢复。本轮从配置、引用和生成链路同时修正。

`overlay/lifeos.json` 统一提供 Yincan Huang、`https://hyc.ac`、头像、描述与站点索引入口。canonical、Open Graph、应用标题/终端站点身份、浏览器本站书签、包元信息和 robots/sitemap 均读取该配置。当前 sitemap 只列根入口、作品集和商店，不列管理设置及上游演示资料；没有修改 DNS。

## 已清理

- 旧 `public/favicon.ico`、`public/screenshot.png`：分享图片与 favicon 都改用圆形头像；旧 URL 返回 404。
- 旧 `System/LifeOS/settings.svg`：设置窗口与开始菜单共用代码内的齿轮路径，窗口图标为 SVG data URL，不留下失效引用。
- 旧 `rss.xml`、`scripts/rssBuilder.js` 和 `scripts/robots.js`：本站生成器只提供现阶段真实存在的站点入口；未实现博客订阅前不声明 RSS。
- 重复 `System/LifeOS/capture.js`：研究截图工具复用原生已有的 html-to-image 文件。
- 重复 `site.ts` 名称配置：归并到 JSON 单一来源。
- 上游作者默认浏览器书签、未提供内容的 OldSite 特判与预置 Nostr 联系人。保留浏览器、Dino 游戏和 Messenger 本身。Webamp 不因更改域名就假设 `hyc.ac` 获得第三方 CORS 许可，随机皮肤入口沿用仅本地可用的限制。
- 两个 `.DS_Store`，历史 ProzillaOS 样机的 `dist` 和 `node_modules`（43,512,342 字节可重建内容）。
- 当前原型 `.next`、`.swc`、TypeScript 增量文件及旧静态输出/索引：清空后重新构建；构建缓存再删除，静态输出用于现有本地服务。

## 防止回流与保留边界

`build.mjs` 执行固定 SHA 检查、受保护接入、清理构建产物、完整构建、站点残留检查，成功后删除构建中间产物。`prepare.mjs` 删除受版本控制的旧资源前对比已审核字节；遇到不认识的本地内容拒绝删除。构建产物被明确视作可重建目录。

`audit-site.mjs` 检查运行源码、public 和 out，阻止旧作者域名、邮箱、公钥回流，同时验证废弃资源不存在、robots/sitemap 指向本站、头像存在、必需 JSON 索引有效。`.index` 中的文件系统、搜索、快捷方式与预载图标索引是 daedalOS 运行依赖，必须重建并交付，不能只因名称含 cache 就删除。

33 项原生进程条目逐段与固定上游比较一致；许可证原文、第三方软件/协议资源、历史 Issue 报告与研究证据保留。没有清空访客浏览器文件、应用库、语言设置，或本地 `.runtime` 内容与密钥；没有清理机器级浏览器/npm/Yarn 缓存。

## 验证

无缓存完整构建通过（89.19 秒）；11 个相关运行源码/配置文件通过上游 lint；prepare 连续执行通过。扫描 1,681 个文本文件未发现旧身份。故意加入旧域名的临时产物会被检查拒绝；放入未知内容的待删除文件会被保留并报错，移除测试夹具后检查恢复通过。

浏览器确认设置齿轮加载、开始菜单设置与 Power 并列、30 项商店目录、Paint 画布与 Browser/Dino 页面正常；书签使用本站名称，未请求旧站点资源。5 个废弃 URL 返回 404，robots/sitemap、必需索引和头像返回 200；canonical / Open Graph 指向 `hyc.ac`，作品集标题与头像正常。

逐项证据见 [checks.json](evidence/site-cleanup/checks.json) 与 [browser.json](evidence/site-cleanup/browser.json)。原型验证不代表全部 33 项 App 的完整功能或外部服务均已回归。未部署生产。
