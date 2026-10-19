# 桌面多选拖动预览尺寸修复

关联 Issue：#48。用户报告一次拖动多个桌面图标时，预览中的图标、文字和快捷方式箭头明显放大。

## 原因与修改

`useDraggableEntries` 使用 html-to-image 生成多选拖动截图。截图默认按 `devicePixelRatio` 放大位图，再将 PNG 交给 `setDragImage`，使图片固有尺寸和以 CSS 像素计算的鼠标偏移不一致。修复将这一截图的 `pixelRatio` 固定为 `1`，使位图、裁剪偏移和桌面布局使用一致的单位。

新增 `e2e/desktop-drag.spec.ts`，在 1、2、3 倍像素密度下执行实际多选、截图生成和拖动事件处理，读取交给 `setDragImage` 的图片像素，检查非透明内容不超过原选择边界。测试同时检查预览确实包含图标，避免空图通过。产品与公开部署测试配置均纳入此用例。

## 修复验证

在从 `main@745e25fe` 建立的隔离分支 `fix/desktop-multiselect-drag` 中，使用 Node 22.23.3、Yarn 1.22.22 和既有依赖的 APFS 克隆验证，没有重新安装或升级依赖。主工作区的运行数据与 4392 预览保持。

- 修复前：1 倍测试通过，2 倍与 3 倍分别测得 120、180 像素的可见预览宽度，超过原选择的 74 CSS 像素，两个用例准确失败。
- `yarn build`：生产编译、类型检查、静态导出与站点资源审计通过，审计 1739 个文本文件。
- `yarn lint`：通过。
- `yarn test:unit`：10 个测试套件、84 项通过。
- `LIFEOS_PORT=4394 yarn playwright test --config=playwright.product.config.ts e2e/desktop-drag.spec.ts e2e/product.spec.ts`：21 项通过，包含三个像素密度的拖动回归及原生 Paint、File Explorer 加载。
- 最终整理测试代码后，单独重跑三个拖动回归，均通过。
- ego-browser 实际操作：在 2 倍像素密度的 Chromium 中框选 App Store 与 Dashboard，两者一起从第 1 列移动到第 4 列，再次一起移动到第 6 列；图标边界一直保持 74×70.4 CSS 像素。单图标 My PC 拖动正常，继续使用浏览器默认预览。检查生成的实际拖动图片和放置后的桌面截图。
- `git diff --check` 与修改文件的 Prettier 检查通过。

浏览器证据保存在主工作区忽略目录 `.cache/agent-work/desktop-drag-20261018/`。回归使用真实截图实现；自动测试的 `dragstart` 事件由脚本触发，实际鼠标拖动、放置和重复拖动由独立的 ego-browser 操作验证。

修复验证阶段未执行 Firefox、Safari、触屏真机和完整公开部署构建。用户随后授权提交、推送、合并、清理和上线；发布按 [Pages 发布手册](../deployment/pages.md) 执行，完整流水线、线上版本与清理证据继续记录在 #48。
