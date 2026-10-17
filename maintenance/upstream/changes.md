# 产品差异登记

实际文件差异以 `git diff <baseline.sha> HEAD` 为准，下面列出维护责任，不把数量视为永远固定。

| 分类 | 位置 | 升级检查 |
| --- | --- | --- |
| 应用注册与装配 | contexts/process/directory.ts、pages/_app.tsx、pages/index.tsx | 33 个原生进程、3 个产品进程；Provider 顺序；默认桌面与深链接 |
| 自有 UI 与内容 | components/apps/Portfolio、AppStore、components/system/PersonalOS | 原生样式、关闭保护、双语、编辑发布流程 |
| 系统适配 | StartMenu Sidebar、Window Titlebar、useProcessContextState | 侧栏4入口、设置单实例、窗口操作与未保存提示 |
| 站点身份 | personal-site.json、utils/constants.ts、Metadata、useFaviconAndTitle | Yincan Huang、hyc.ac、头像与分享信息；清理文件不得回流 |
| 上游作者入口清理 | Browser/config及index、Messenger/hooks、Webamp/functions | 不预置他人身份；不删除应用；不假设新域名获得第三方 CORS 许可 |
| 构建与工具 | package.json、scripts、tsconfig、oxlint、jest、工作流 | 不从研究目录取源码；不自动升级依赖；不部署；保留必须的 .index |
| 上游资产退役 | favicon.ico、screenshot.png、旧 RSS/robots 生成链 | 删除是明确的产品差异，升级时复核引用和生成器 |
| 开发服务 | server/ | 仅本地开发；权限/API回归；不迁入原型密钥或运行数据 |

原生目录、LICENSE 与上游依赖锁文件保留。研究证据中的原域名是历史引用，不做全文替换。`.gitattributes` 对归档使用 `text=auto`，防止将 PNG 等二进制证据作文本转换；已核对29份归档图片字节保持一致。
