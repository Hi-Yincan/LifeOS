# daedalOS 作品集概念验证报告

2026-10-16 · 真实 daedalOS 集成研究原型；不是生产验收。

## 环境与接入

上游固定 `f017b393d4175eb396a741a7562299423843f1b1`。Node 26.7.0、Yarn 1.22.22，锁定上游依赖安装后执行生产构建、静态导出和压缩。原型位于本仓库 `research/daedalos-portfolio`，构建 checkout 为独立临时目录。未修改生产站点、根 DNS、现有服务器或 Puter。

保留 33 个原有应用/进程注册项（含系统对话框），删除 0。新增一个业务 App Portfolio 和系统设置增强 SystemSettings。补丁集中在应用目录、Provider、首页、窗口标题栏、关闭保护与页面元数据，共 6 个上游文件；自有代码集中在 overlay。

证据：[集成清单](../daedalos-portfolio/evidence/integration-manifest.json)、[构建摘要](../daedalos-portfolio/evidence/build-summary.json)、[复现步骤](../daedalos-portfolio/README.md)。33 个注册项不等于 33 个独立 App 全功能回归通过。

## 自动验证

| 检查 | 结果 | 证据与范围 |
| --- | --- | --- |
| 内容服务测试 | 9/9 通过 | [TAP](../daedalos-portfolio/evidence/backend-tests.tap)：权限、角色伪造、双语发布、版本冲突、媒体生命周期、CSRF/Origin、重启、非法输入、限速与保留清单 |
| 上游单元测试 | 30/30，2 suites 通过 | [结果](../daedalos-portfolio/evidence/upstream-unit-tests.json)：本地集成 checkout 实际运行；不是完整 Playwright/设备矩阵 |
| 类型检查与生产构建 | 通过 | Next 生产构建执行类型检查，随后静态导出与压缩；上游 Node 22 CI 环境未在本轮本机重复 |

静态导出约 328 MB（十进制），包含原有大型 App 资源。此数不是首屏下载量；不能拿完整输出目录大小推断用户必须下载全部资源。实际线上首屏、缓存与地区性能是计划阶段测量任务。

## 浏览器交互

使用 Ego Lite 的真实浏览器操作，本地管理员为 127.0.0.1，独立访客使用 localhost，避免共用同一 Host Cookie。浏览器验证项目为合成数据，最终保持下架。

- 创建中英草稿、语言切换保留中文输入、上传封面、保存、发布、修改草稿、下架和注销均执行。
- 未发布详情与媒体 404；发布后详情与媒体 200；私有备注不进入公开响应；再次保存草稿不改变公开快照；下架后详情与媒体重新 404；注销后管理列表 401。
- 缺少源码链接时发布被拒绝，补齐后可发布。
- 未保存时点击原生关闭按钮出现确认，取消后编辑器保留。
- 作品详情刷新保持定位；浏览器后退回列表、前进回详情；搜索无结果和不存在作品显示独立状态。

原生 App 抽查：File Explorer 加载 My PC 目录，Paint 加载菜单与画布，Terminal 加载初始提示符，Chess 加载棋盘与初始状态。均为启动检查，不冒充文件写入、绘图导出、终端命令或完整对局验证。显式原生 App 链接没有额外抢开作品集。完整逐项覆盖见 [清单](../daedalos-portfolio/evidence/native-app-coverage.json)。

证据：[管理流程](evidence/browser-lifecycle.json)、[导航](evidence/browser-navigation.json)。公开种子中的 AIPM 技术栈已修正为 MkDocs/Python/JavaScript；初始四项目归属和文字来源见 [来源表](../../specs/concept/sources.md)。

## 视觉与设备证据

两套布局为同一 App 的配置：A 原生工作台、B 现代陈列。建议 B 用于个人站首次展示，A 保留为工具型 App 参考；最终审美选择仍交负责人评审。

图像由实际页面 DOM 渲染生成，**不是原生截图**。原生截图通道在本环境超时，因此同时记录页面几何和真实交互。采集等待窗口动画结束，避免把入场透明度误判为最终颜色。

| 画面 | 查看 |
| --- | --- |
| B 现代陈列 | [桌面概览](evidence/desktop-gallery-dom.png) |
| A 原生工作台 | [桌面概览](evidence/desktop-native-dom.png) |
| 项目详情 | [详情](evidence/desktop-detail-dom.png) |
| 作者管理 | [双语编辑器](evidence/desktop-editor-dom.png) |
| 英文深色 | [概览](evidence/desktop-english-dark-dom.png) |
| OS 设置 | [设置](evidence/settings-dom.png) |
| 手机 | [390px](evidence/phone390-dom.png) · [360px](evidence/phone360-dom.png) |
| 平板 | [竖屏](evidence/tablet-portrait-dom.png) · [横屏](evidence/tablet-landscape-dom.png) |

390×844、360×800、820×1180、1180×820 的概览和详情实测均无横向溢出；触屏窗口位于 (0,0)，为 OS 导航预留 58px。平板切回桌面后设置关闭入口可用。

设备结果见 [浏览器几何记录](evidence/browser-devices.json)。手机自动按宽度进入触屏模式；平板以设置的手动模式核验布局。此环境的触控指针仿真未持久生效，不能将手动平板布局通过说成 iPad 自动判断通过，更不能替代真机。

发现并修复：最大化窗口内部位移与外层触屏定位叠加，导致设置标题栏离开屏幕。触屏现采用 CSS 全屏表现，不修改桌面保存的位置与最大化状态；内层尺寸和位移同步约束，需同时验收模式切换与关闭入口。

## 生产差距与交接

| 未完成项 | 计划任务 |
| --- | --- |
| 数据库事务、多实例持久会话、审计、密钥轮换、跨域部署 | T05/T06/T13 |
| 图片完整解码、媒体画廊/双语 alt、对象存储、缓存失效 | T07 |
| 个人资料管理、冲突比较与失效会话下保留编辑 | T09 |
| 全部公共 OS 菜单本地化；当前仅作品集、设置、窗口操作 | T10 |
| iPad 自动判断、真实触控/外接键盘、全部原 App 运行矩阵 | T11/T12/T15 |
| 每项作品独立 SEO/分享元数据、遗留上游品牌元数据替换 | T08/T13 |
| 实际两个上游 SHA 的升级与回退演练 | T14，#10/#11 保持开放 |
| 国内外网络、Pages 重型 App 响应头兼容、故障切换 | T13/T15 |

本地服务设置 COOP/COEP；Next 静态导出不应用其 headers 配置。GitHub Pages 的重型 App 兼容性尚未证明，不能用本地结果代替。原生代码执行/文件导入的同源管理风险列为生产门禁，必要时采用独立管理 origin，不通过擅自删除原 App 解决。

这里交付的是可评审概念和可运行研究原型；#2 保持待统一评审，#3 接收计划输入。无需缺失个人资料也能完成概念设计，但资料、真实媒体与最终视觉必须在公开发布前复核。
