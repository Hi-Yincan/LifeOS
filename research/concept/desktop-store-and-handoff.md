# App Store 桌面入口与概念交接

2026-10-17 · 负责人要求 App Store 同时放在桌面，并提出概念阶段收尾及后续复用问题。

## 桌面入口

`prepare.mjs` 为 App Store 和 Portfolio 同时生成开始菜单与桌面快捷方式。App Store 的两个入口均指向既有单实例 `AppStore`；桌面已有 My PC、Public、Portfolio 保留。遇到无法识别的同名桌面快捷方式时拒绝覆盖。

验证：连续执行 prepare 两次通过；桌面和开始菜单 `.url` 内容相同；快捷方式缓存中 Desktop/App Store 的 BaseURL 为 AppStore。完整构建通过（82.77 秒）。浏览器实际显示四个桌面入口，双击后打开 29 项目录的商店；最小化后再次双击恢复同一窗口，实例数仍为 1。验证后保留桌面页面供查看。

证据：[source.json](evidence/desktop-store/source.json)、[browser.json](evidence/desktop-store/browser.json)、[checks.json](evidence/desktop-store/checks.json)。此改动未重复运行与入口无关的内容服务测试。

## 概念收尾与复用建议

视觉、交互及当前产品方向收束到本版；正式开发与生产发布未启动。后续建议把原型作为正式工程的开发基线，迁移已确认 UI、交互、业务规则及有效测试，再逐项落实生产存储、认证、媒体、部署和上游同步。

具体复用、重构、替换分类与进入计划阶段的顺序见 [prototype-handoff.md](../../specs/concept/prototype-handoff.md)。第三方 URL/代码包、访客自建/站长发布、仓库拓扑等未决事项仍进入计划决策，不因概念收尾而视为已经批准。

保留概念分支与草稿 PR #16 作为可追溯基线，正式工程接管后续功能演进。本次没有合并 PR、发布站点或改动 DNS。
