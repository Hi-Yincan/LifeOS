# 原型内容服务源码审计

日期：2026-10-17。基线：`a59eda1f195e2f46d6a3cab574c2fd3f3625095f`。执行者：`codex-forward-content-audit`。

本次在一次性本地克隆的独立 worktree 中核验内容服务、内容测试及最新概念交接，只新增本报告；未修改产品代码，未访问用户正在设计的原型运行目录。证据等级为源码核验和本机 HTTP 自动检查，不代表浏览器、真机或生产验收。

## 已验证行为

- `research/daedalos-portfolio/service.mjs:68` 仅从发布快照返回列表，并按快照中的 order 排序；`:94` 修改草稿，`:98` 显式复制发布快照。版本检查在 `:90`，下架在 `:99`。对应 `test/content.test.mjs:41` 的草稿/发布/409/下架测试通过。
- 媒体授权取决于发布引用或管理会话（`service.mjs:74`），不是文件名保密；响应禁止缓存（`:77`）。对应 `test/content.test.mjs:59` 的草稿私有、发布可读、下架撤回测试通过。
- 管理接口服务端要求会话及写入 CSRF（`service.mjs:79`），异源写入被拒绝（`:52`）。已有越权、CSRF、注销、重启和限速测试均通过。

## 具体发现

1. **中：公开白名单未深入 translations。** `service.mjs:11` 将整个 translations 对象放入公开输出；`:37` 只检查 zh/en 的已知字段，`:92` 只过滤顶层请求字段。因此作者客户端附带的未知翻译字段可以在发布后公开，不符合 `specs/concept/data-and-permissions.md:24` 的私有元数据白名单边界。隔离 HTTP 探针在 zh 下添加普通标记字段，保存/发布返回 200，访客详情确实返回该字段。此处不构成访客越权写入，但可能意外发布编辑器元数据；建议发布序列化显式投影 locale 和翻译字段，并补嵌套字段不外泄用例。当前测试 `test/content.test.mjs:29`、`:50` 仅证明顶层字段被过滤。
2. **低：错误标题类型返回 500。** `service.mjs:39` 在确认字符串之前调用 `title.trim()`；合法管理会话提交数字标题时，隔离探针得到 500/`SERVER_ERROR`。建议与其他字段一样先检查类型，将错误归为 400，并覆盖 null、数字、数组和对象。该发现仅涉及输入验证与错误语义，未观察到数据被写入。

上述两项均由本机临时 fixture 复现，未写入真实内容。报告不包含口令、会话或运行数据。

## 检查记录

- `node --test research/daedalos-portfolio/test/content.test.mjs`：9/9 通过。初次沙箱运行有 8 项因 `listen EPERM 127.0.0.1` 无法启动；通过宿主正常授权流程重跑后全部通过，不能把第一次环境阻断算作产品失败。
- 两项额外 HTTP 边界探针：确认未知嵌套字段可公开、数字标题返回 500；均使用临时数据目录和系统分配的本机端口，无常驻进程。
- 交付门禁由 workflow helper 检查 `service-syntax` 和 `report-present`；最终结果以批次 gate log 及提交证据为准。

## 生产缺口（已在规格中列出）

以下是交接明确保留的正式开发工作，不混作本次新增原型回归：`specs/concept/prototype-handoff.md` 要求替换本地 JSON 与内存会话；`specs/concept/data-and-permissions.md:45` 要求个人资料草稿/发布、媒体集合和双语 alt；`:76` 要求图片实际解码/尺寸限制、对象存储与多实例能力；`:82` 要求生产会话、HTTPS 与轮换策略。当前服务 `:18`、`:21`、`:67`、`:103` 分别仍是 JSON 持久化、进程内会话、seed 个人资料直读与图片签名检查。此审计不认定 A14 或其他生产安全门禁通过。

已同时读取当前概念 README、implementation-plan、acceptance、prototype-handoff；后续任务应按其中 T05–T07/T09 的生产范围拆分，不应因现有 9 项测试通过而宣称正式服务完成。
