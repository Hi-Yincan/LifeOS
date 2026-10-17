# 应用商店顶部布局修复

2026-10-17 · #19 · 对 C29 视觉验收遗漏的补充。

## 用户反馈与复现

截图显示地址栏图标和文字重叠，分类/搜索控件被分隔线穿过。真实浏览器几何检查在修复前失败：图标与文字间距 -7px，控件底部到分隔线间距 -17px。原验收只检查了窗口总体横向溢出与图标资源加载，没有检查内部元素的相对位置，未能发现这两个问题；C29 的视觉通过结论不足以覆盖顶部布局。

回归入口：`research/daedalos-portfolio/tools/store-layout-evidence.mjs` 导出的 `assertStoreLayout(page)`。在 ego-browser Page 打开 `/?app=AppStore` 后运行；验证实际浏览器几何而不是 CSS 文本。内容改动和动画完成后再测量。

## 根因与修复

1. 上游 StyledAddressBar 将后代 img 绝对定位。商店使用图标＋文字的 Flex 行，图标脱离布局后与文字重叠。只在商店内让地址栏图标回归普通布局，并给 picture 固定 16px 占位；上游控件和其他 App 不变。
2. 上游窗口样式 `header + * { height: calc(100% - 30px) }` 会匹配后代。商店将自己的导航栏渲染为 header，导致紧随的分类工具栏受到高度规则影响。移除多余的 `as="header"`，使用 StyledNavigation 默认的 nav 标签；保留原生窗口标题栏与其内容区域的高度契约。

3. 窄窗口下，工具组的 `flex: 1` 默认以 0 为基础宽度参与排布，被留在分类旁边并压成窄列。改为 `flex: 1 1 300px` 并垂直居中，让空间不足时自然换行；不新增设备模式或断点布局。追加检查搜索输入区可读宽度与按钮单行高度。

独立探针证据：仅修复图标定位，间距从 -7px 变为 6px，而工具栏仍失败；再解除误匹配的高度约束，底部间距从 -17px 变为 9px。探针在修改源码前运行，随后刷新清除；最终源码不包含临时 height 覆盖或调试注入。

## 验证

- 修复前后测量：[diagnosis.json](evidence/app-store-layout/diagnosis.json)。
- 五组实际浏览器回归全部通过：[verification.json](evidence/app-store-layout/verification.json)。默认窗口 820px 中/英文、最大化 1440px 中文、390px 中/英文；图文间距均为 6px，控件底部至分隔线均为 9px，搜索与按钮可读性通过。
- 窄屏可读性修复前后：[wrapping.json](evidence/app-store-layout/wrapping.json)。
- [桌面图](evidence/app-store-layout/desktop-zh.png)与[窄屏图](evidence/app-store-layout/narrow-zh.png)均已查看；图像是 DOM 渲染结果，不是原生截图或真机验收。
- 类型检查与 AppStore lint 通过；最终完整构建通过（265.97 秒），详见 [checks.json](evidence/app-store-layout/checks.json)。未重复运行与此布局修改无关的内容服务测试。
- 回归检查覆盖图文最小间距、控件位于工具栏内、分隔线位于控件下方、正文在控件下方控件横向边界、搜索输入区可读宽度和按钮单行高度。

预防方式：复用上游 Styled 组件时同时检查其定位规则及窗口容器的后代选择器。视觉验收增加内部元素几何断言，不以“整窗无横向溢出”替代顶部布局检查。本次不扩大为修改上游全局选择器。
