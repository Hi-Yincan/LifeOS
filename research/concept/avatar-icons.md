# 作品集与网站头像图标

2026-10-17 · 负责人要求作品集和网站图标都使用其圆形头像，并指定参考 `Hi-Yincan/blog`。

## 来源与复用

blog 的 `src/_includes/layouts/base.njk` 使用 `/assets/images/favicon.png`，资源来自其 `content` 子模块。直接复用子模块固定提交 `5fe34ffcdecf12c70a295c7d96bf6c971b35200a` 的 `assets/images/favicon.png`，940 × 940、透明背景圆形裁剪。已查看图像；项目内 `avatar.png` 与来源逐字节一致，没有重新生成或改变人物内容。

用户最初提供的 Documents 原图受到本机系统权限保护，读取未成功；本次使用用户随后明确指定的 blog 现成圆形图标完成替换，未声称读取或比较过受保护原图。来源与哈希见 [source.json](evidence/avatar-icons/source.json)。

## 接入

- `avatar.png` 是站点 favicon 的固定资源。
- `portfolio.svg` 嵌入同一份 PNG，保留已经发布到原型桌面、开始菜单和进程注册中的图标 URL，使已有入口自然更新；PNG 与 SVG 内嵌内容一致。
- 作品集窗口、任务栏、商店目录和概览沿用同一图标来源。
- 在上游 `useFaviconAndTitle` 增加一个受保护的接入补丁，使 favicon 和离开页面时的回退均指向头像；仍保留上游的动态窗口标题行为。
- 当前上游接入补丁共 8 个；原生应用条目与图标资源不删除。根站点入口和生产部署不变。

## 验证

完整构建通过（164.96 秒）；Next 类型检查与 favicon hook 的上游 lint 通过。浏览器验证作品集、商店、桌面三种前台状态下 favicon 均保持同一个头像；窗口标题仍分别更新。PNG 四角 alpha 为 0、中心为 255；桌面、任务栏、窗口和概览四处作品集图标加载成功，商店目录继承同一资源。已查看作品集实际 DOM 渲染图。

构建与浏览器验证结果见 [checks.json](evidence/avatar-icons/checks.json) 和 [browser.json](evidence/avatar-icons/browser.json)。本次为图标资源和 favicon 接入修改，不重复执行无关的内容服务测试。
