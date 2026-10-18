# 综合看板：自建服务目录与可用性调研

核验日期：2026-10-18（UTC）。关联：LifeOS #32、HuangYincan/idea #9。本文是实现前研究，未部署任何监测服务、未读取本机密钥或运行数据、未执行生产探测；项目源码基线为 `dba64cb0181bde7e8dc1f1610263d9a2c6983267`。

## 1. 结论与需求边界

建议在综合看板内实现 OS 原生的「服务」视图，使用 LifeOS 自己的服务目录与权限模型，并通过适配器读取独立监测后端。UptimeFlare 是已有 Issue 明确列出的候选，应优先验证其只读适配；Uptime Kuma 作为需要内网监测、更多检查协议或本地持久化时的补充候选。Homepage、Homarr、Dashy 提供目录、分组、集成和状态交互的参考，不需要为了展示服务而同时部署三个门户。[I1][I2][I3]

idea #9 原文包含三项：展示有哪些自建服务、展示服务可用性、展示服务器情况。LifeOS #32 在本次初始读取时正文为空，评论关联 idea #9 与 UptimeFlare。本研究负责前两项以及与服务器实体的关联；CPU、内存、磁盘、流量、主机心跳的采集与探针选型由服务器探针研究负责。不能把 TCP 端口可连接解释为主机资源正常，也不能把主机在线解释为应用可用。[I1][I2][I3]

应分开四种事实：

| 事实 | 产生方 | 能说明什么 | 不能推定什么 |
| --- | --- | --- | --- |
| 服务目录 | 管理员维护并发布的内容 | 服务名称、用途、公开入口、分类、关联主机 | 当前可用、所有访客有访问权限 |
| 当前浏览器访问 | 访客浏览器及其网络 | 这个访客能否打开入口 | 对其他地区可用、后台持续可用 |
| 独立可用性观测 | UptimeFlare / Kuma 等监测器 | 某探测位置、时刻、协议和断言下的结果 | 全球可用、完整业务链路正常 |
| 主机观测 | 主机 agent / 监测系统 | 资源、心跳及采集时间 | 每个服务的业务健康 |

表中是 LifeOS 建模建议。目录和监测应分别可用：没有监测器的目录项显示「未监测」，监测器失联时目录入口仍可浏览；不得从前端页面是否打开决定独立监测是否运行。

## 2. 固定的一手来源与维护快照

通过 GitHub API 读取官方仓库默认分支提交、发布记录、许可证、README、部署文档和接口源码。`web.run` 本次未返回可用内容，改用认证 GitHub API 只读查询。下列 SHA 固定本次分析内容；默认分支提交不等于已部署版本，版本号也不等于 LifeOS 已验证兼容。五个仓库在核验时均未归档，提交与发布日期只证明可见维护活动，不证明生产 SLA。[H0][O0][D0][F0][K0]

| 项目 / 主要角色 | 本次固定提交 | 当时发布与维护记录（UTC） | 仓库许可证 | 对 LifeOS 的适用性 |
| --- | --- | --- | --- | --- |
| Homepage：服务导航与集成数据 | `51cc1684f9f34a7877ed462b8f94c9cc687b4dde`（dev） | 提交 2026-10-17；release `v2.6.0`，2026-10-17 | GPL-3.0 | 参考「入口 / 监测目标 / widget」分别配置的模型；不作为 LifeOS UI 组件库 |
| Homarr：可编辑看板与多服务集成 | `69e3976297b0f7df9aec42c61ecfd82dbd100de3`（dev） | 提交 2026-10-17；release `v2.6.0`，2026-10-15 | Apache-2.0 | 参考集成适配器、运行时 schema、连接测试和权限过滤 |
| Dashy：服务目录、搜索与可选状态指示 | `a0005e8d6ea3dad611bc7c4daa1cd837dd338c79`（master） | 提交 2026-10-16；release `4.8.0`，2026-10-09 | MIT | 参考入口分类、独立状态 URL、显式启用检查；区分页面触发检查与持续监测 |
| UptimeFlare：独立可用性监测 | `520c0b8dcfcedf8e147863482a490f42af1a76e3`（main） | 提交 2026-10-07；仓库无 GitHub Releases | Apache-2.0 | 既有候选；优先验证公开 JSON 摘要适配，按 SHA 固定，不编造版本号 |
| Uptime Kuma：自托管可用性监测 | `b092505f894d66669b67f46e1da72b51016eceab`（master） | 提交 2026-10-13；release `2.5.6`，2026-10-09 | MIT | 内网或多协议监测候选；公开状态页接口可支撑只读汇总 |

许可证列记录官方仓库信息；本期建议独立实现 LifeOS 领域模型和控件，不复制五个项目的界面或组件。后续若实际引入源码、图标或其他资产，必须逐项记录来源文件、固定提交和许可证，并维护第三方署名；不能把仓库许可证自动套用于所有外部图标与商标。[H0][O0][D0][F0][K0]

## 3. 候选项目的实际能力与可借鉴点

### 3.1 Homepage

官方文档用 `services.yaml` 表达分组、服务、入口 `href` 和描述。一个服务可以同时具有多个 widget；widget 地址可与入口不同。`ping` 是运行 Homepage 的主机发出的 IPv4 ICMP 检查；`siteMonitor` 使用 HTTP HEAD，失败后尝试 GET，文档明确说明它不会自动完成应用登录。Docker 容器状态和业务集成又是独立关联。这证明服务入口、业务 API、HTTP 健康端点与容器/主机不能共用一个含义不明的 URL 字段。[H1][H2]

默认部署是常驻 Node/容器，持久保存配置；可选 Docker socket，API 请求由服务端代理。当前 README 已包含可选内建 OIDC / 简单密码登录，因此不能沿用旧文章中「Homepage 完全没有认证」的描述。它仍要求不可信网络入口使用认证、TLS 和 Host 校验等保护。LifeOS 无需部署 Homepage 来获得上述目录结构。[H1]

**接口判断：** 本次看到的是配置文档及 Web App 自用 `/api/ping`、服务代理等源码，没有在所读资料中找到对 LifeOS 外部消费者承诺的统一版本化服务目录 API。若未来导入 Homepage 配置，应做单次、可预览的转换，并忽略密钥字段；不让 LifeOS 长期依赖其内部页面接口。[H2][H3]

**借鉴而不照搬：** 服务稳定 ID、目录分组、独立访问 URL / 探测引用、可选扩展字段；前端使用 LifeOS 工具栏、列表、详情与状态栏。Homepage 的卡片布局、样式、认证系统和 Docker 操作不随参考行为迁入。

### 3.2 Homarr

当前 Homarr 已是 v2 monorepo，包含 API、认证、数据库、board、widget、翻译等共享包。官方部署文档要求持久化 `/appdata`，包括数据库与配置；服务集成 URL 必须从容器可达，可与浏览器入口主机名不同。v1→v2 会原地迁移数据库，回退需要原有数据备份，仅回退容器镜像不足。单独部署会增加完整数据库与权限的维护流程。[O1][O2]

**接口判断：** 当前官方文档提供 `/api/openapi` 与选定 REST 操作，高级操作走 tRPC，两者接受 `ApiKey`。API key 按创建者权限生效；集成列表由服务端过滤，内部 URL 被视为敏感字段。因此 Homarr 具有可识别的外部 API 文档，但使用它会引入另一套身份、权限与持久化，不适合仅为 LifeOS 综合看板再添加一层看板后端。[O3]

**可借鉴的适配器：** 官方 Kuma integration 分别抓取状态页元数据与心跳，先进行 schema 校验，再映射监测器 ID。这是良好的适配边界；但当前实现把 Kuma 的 `pending` 和 `maintenance` 都折叠成 `paused`，缺少心跳也落为 `paused`，未知状态码默认 `down`。LifeOS 不应继承此简化，应保存待确认、维护、缺失与非法状态的区别。[O4][O6]

Homarr 的简单 ping cron 每分钟执行已登记 URL 的检查，与其独立 Kuma integration 并存。可借鉴「看板简单可达性」与「监测系统数据」各自有来源；不能因为两者都显示状态点就合成同一事实。[O5]

### 3.3 Dashy

Dashy 提供 YAML 目录、搜索、标签、多个页面、可视编辑和状态指示。官方文档说明状态检查默认关闭；开启后默认仅在页面加载时检查，持续轮询还需配置 interval。真正 HTTP 请求由 Dashy Node 服务端执行，并非由访客浏览器直接探测目标；静态 CDN 部署没有相应 Node 端点。其状态文档的 CORS 排查文字与服务器端执行描述容易混淆，本研究以实际 endpoint 源码及文档「How it Works」描述判断执行位置。[D1][D2][D4]

**接口判断：** 当前提供可选 REST 配置 API，默认关闭，`ENABLE_API=true` 才开放。其 API 覆盖配置文件、section、item 的读写；配置身份验证与管理员权限在服务端执行，但无身份验证配置时 API 可开放。它是配置管理接口，不是有历史保证的持续监测 API。并发写入为最后写入覆盖，未提供乐观锁，不能直接作为 LifeOS 已有版本冲突语义的替代。[D3]

**借鉴而不照搬：** 服务名 / 标签 / 域名搜索、独立 `statusCheckUrl`、预期状态码、显式关闭检查、状态加文字和形状。LifeOS 不采用 Dashy 的整套主题编辑、工作区嵌入网页和独立设备布局；应用入口依旧按 OS 已确认的窗口与外链规则处理。[D1][D2]

### 3.4 UptimeFlare

官方 README 与部署代码显示：Cloudflare Worker 每分钟调度，D1 保存状态，Pages 提供状态页及 JSON API，可用 Durable Objects 或其他 check proxy 指定探测位置。2026-01 已由 KV 迁到 D1；配置字段仍叫 `kvWriteCooldownMinutes`，名字不是仍使用 KV 的证据。支持 HTTP(S)、TCP、预期 HTTP 状态码、包含/禁止关键词、请求 header/body、维护窗口、故障记录、通知 grace period 和 webhook。[F1][F2][F3][F4]

源码还包含 Globalping adapter，但其支持的 method/body 有限制；位置代理失败可配置回退本地探测。LifeOS 必须保留实际 `location`，不能将回退后的结果继续标为原指定地区，也不能把所有地区结果平均成一个无含义的延迟。[F4]

**接口判断：** `/api/data` 是 README 明确列出的 JSON API，当前返回 `up`/`down` 汇总、`updatedAt`、`monitors[id]` 和 `maintenances`；每个 monitor 返回 `up`、`latency`、`location`、`message`。它没有版本号或独立 JSON schema；需要在 LifeOS 适配层固定契约、校验输入并记录上游版本。[F1][F5]

**关键限制：**

1. `updatedAt` 为 Unix 秒，源于持久化状态的 `lastUpdate`。默认未变更时约每三分钟写入，状态变化时立即写；不能以「超过一分钟」直接判定过期。后端调度、持久化周期、HTTP 缓存与 LifeOS 拉取周期要共同确定 freshness 阈值。[F3][F5]
2. 此公开 JSON 不返回历史延迟序列、完整事件历史、每个 monitor 独立观测时间、monitor 展示名、目标 URL 或完整监测断言。MVP 可显示最新摘要和发布目录关联；趋势与可用率若需要，只能通过后续明确导出契约或本地按时间采集，不能从单个快照推算历史。[F5]
3. 源码保存近期 12 小时延迟及最多 90 天已结束事件，但这不是 `/api/data` 提供 90 天时序 API 的承诺。`kvWriteCooldownMinutes` 冷却期间未写入的普通探测结果也不能被假定永久保存。[F3]
4. `pageConfig.group` 的文档说明未列入分组的 monitor 不在页面显示但仍会监测；`/api/data` 实际遍历所有 `workerConfig.monitors`。UI 隐藏不是 API 公开授权，LifeOS 必须由服务端/导出器白名单选择监测器，并审查维护文案与错误信息。[F5][F6]
5. 默认 JSON API 有通配 CORS；配置 `passwordProtection` 后 middleware 要求 HTTP Basic。私有实例的凭据只放服务端，不放 Pages bundle；公开只读端点也必须经过数据公开性审查。[F5][F7]
6. Globalping API 失败在当前实现中可能返回 `up=false`、`location=ERROR` 和 `Globalping error`；普通 check proxy 失败也可能产生 `Proxy check failed`。这些是探测设施失败证据，不能无条件视为服务宕机。当前缺少稳定机器错误码，应明确列入适配兼容性风险。[F4]

**版本底线：** 官方公告 CVE-2026-29779 说明，2025-09-21 至 2026-03-04 的特定旧版本可能将 `workerConfig` 中凭据打包到客户端；修复 SHA 为 `377a5963c66ba9a798abebfe8d80378b053435e9`。后续如部署或接入既有实例，需核验实际构建包含修复，并检查客户端产物不含私有配置；本研究未检查用户是否已有实例，因此不声称现有环境受影响。[F8]

### 3.5 Uptime Kuma

官方 README 支持 HTTP(S)、关键字/JSON 查询、TCP、Ping、DNS、Push、WebSocket、Docker 等检查与多种通知方式。部署是常驻容器或 Node 服务，需本地持久数据目录；官方说明 NFS 等文件系统不受支持。把实例放在能访问内网目标的位置，可弥补公有云探测点不能直接访问私网的限制，但仅证明该网络视角。[K1]

**接口判断：** 当前源码存在公开状态页 JSON：`/api/status-page/:slug`、`/api/status-page/heartbeat/:slug`，以及事件历史端点 `/api/status-page/:slug/incident-history`。心跳端点只查询该 status page 的公开监测器，返回最新最多 100 次心跳与 24 小时 uptime；元数据缓存五分钟，心跳缓存一分钟。公开心跳明确清空 `msg`，保留 `status`、`time`、`ping`。应优先读取这些结构化数据，不抓取 HTML 或解析 SVG badge。[K2][K3]

这些是随应用实现的状态页接口，不能假定为统一版本化的完整监测管理 REST API；本次未验证外部管理 API。若未来管理 monitor，独立设计写入适配、认证与版本兼容任务，不将管理员 Socket.IO 会话直接发给访客。[K1][K2]

`status=0/1/2/3` 分别是 down/up/pending/maintenance；pending 不等于 down，也不等于暂停。缺少心跳是 unknown。公开 API 中清空错误说明是对 LifeOS 可借鉴的公开字段白名单模式。[K3]

## 4. 建议的数据与适配契约

以下是研究提出的契约方向，实施者应与综合看板公共模型统一命名后定稿。

| 实体 | 最少字段 | 约束 |
| --- | --- | --- |
| Service | 稳定 `id`、双语名称/描述、分类/标签、排序、公开入口、可见性/发布状态、可选主机引用 | 入口不含凭据；目录稳定 ID 不随名称或域名变化；无监测器也可展示 |
| MonitorBinding | `serviceId`、`providerId`、`externalMonitorId`、检查类型、预期调度/发布周期、可选观测位置、公开状态标记 | 一个服务可有多个监测器；monitor ID 与 provider 共同定位，不能仅靠名称匹配 |
| ProviderSnapshot | `schemaVersion`、provider 类型/版本、`fetchedAt`、源 `generatedAt`、连接结果、观测列表 | 拉取成功但源时间未推进，不算数据更新；解析失败显式报错 |
| Observation | `sourceMonitorId`、结果、采样时间或来源时间、时间精度说明、实际位置、延迟与单位、来源状态 | 不存在的每监测时间填空并说明粒度，不用拉取时间冒充探测时间 |
| Incident / Maintenance | 稳定 ID、影响服务/monitor、开始与结束时间、状态、已审查公开文案、来源 | 维护不等于故障恢复；结束时间为空需明确「仍在进行」 |

服务健康和数据质量应使用两个维度，避免一个枚举掩盖事实：

- `health`：`up`、`down`、`pending`、`maintenance`、`unknown`。多检查服务的 `degraded` 由明确聚合规则产生，不能仅因慢或缺数据自动生成。
- `freshness`：`fresh`、`stale`、`missing`。另外保留 provider 连接/解析错误。UI 可显示「数据已过期；上次可用」，不能延续绿色「正常」而不标时间。
- 未配置监测显示「未监测」；已配置但从未获得有效观测显示「未知」；有历史且超时显示「已过期」；收到新鲜的目标失败观测才显示「不可用」。错误来源不明时显示「探测异常」，保留上游原始状态用于管理员诊断。
- 过期阈值与实际采样、持久化/公开周期和缓存预算相关，配置版本变化时同步更新。UptimeFlare 默认周期的首版候选阈值可为五分钟，但必须经真实 Worker 调度与端点缓存观测确认后定稿，不能把五分钟写成跨 provider 常量。
- 维护为覆盖层：保留底层观测与历史，公开摘要可优先显示维护。维护范围未指定时需按 provider 文档解释，不自行推断为某一台主机。

适配器建议输出 `loadSnapshot()` 及显式能力：`currentStatus`、`history`、`incidents`、`maintenance`、`privateRead`。UptimeFlare MVP 的 `history` 为 false；API 能力不足应在详情中说明，不显示空曲线冒充没有事故。服务目录不引用 provider 原始配置或 TypeScript 模块，前端只接收归一化公开 DTO。

### 多探测位置与汇总规则

一个服务的「公网 HTTP 检查」「内网健康端点」「TCP 端口」均保留独立条目。研究建议首期显示逐条观测并由管理员指定主检查；综合摘要分别计数可用、不可用、维护、未知/过期，不把所有监测器的 uptime 简单平均后称为整体可用率。后续需要地域聚合时，必须明确哪些位置必需、何时算部分异常、缺失样本如何进入分母。HTTP、TCP、ICMP 延迟必须标注方法与位置，不跨协议直接比较。

## 5. 部署成本与 Pages 兼容性

本节比较运维组成，不承诺免费额度、固定月费或性能容量。UptimeFlare README 的「免费」「最多 50 个一分钟检查」属于项目说明；上线前仍需按当时 Cloudflare 账户计划、CPU/子请求、D1、Durable Objects、日志与通知供应商额度测量，不把 README 当成本保证。[F1][F2]

| 路径 | 新增运行组件 | 数据与运维成本 | Pages 静态访客版处理 |
| --- | --- | --- | --- |
| 仅 LifeOS 目录 | 已有内容模型和公开导出 | 管理员维护元数据；无持续探测成本 | 可立即提供已发布目录；显示未监测或快照时间 |
| UptimeFlare 公开摘要 | Worker cron、D1、Pages API；按位置方案可能有 DO / Globalping | 云平台部署凭据、配置更新、数据保存、额度、通知供应商 | 可读取经审查的公开 CORS JSON；有私有字段时必须增加服务器端白名单导出/代理 |
| Kuma 摘要 | 常驻主机/容器、持久数据、备份、升级、反向代理 | 机器与存储、内网路由、监测本身健康、通知；必要时多个网络位置 | 公共 JSON 的浏览器跨域访问不能只据源码中的开发 CORS 辅助函数假定可行；优先由只读 adapter 提供同源/明确 CORS 端点 |
| 部署 Homepage / Homarr / Dashy 再嵌入 | 另一套 Web 应用及配置/数据库/认证 | 重复部署、升级、权限和 UI 维护 | 不建议作为综合看板实现；参考领域逻辑即可 |

当前 LifeOS 生产为 Pages 静态访客版，本地内容 API 不是已验收的生产后端。实时私有数据接入依赖生产服务或独立的公开脱敏导出服务；不能用静态构建秘密、浏览器 Basic 凭据或公开 CI artifact 绕过。若首期只提供构建时快照，必须显示来源时间并按过期规则降级，不能称为实时看板。真实服务列表与访问范围尚未提供，研究不会构造用户真实服务清单。

## 6. 失败、内网与公开性边界

### 探测与读数失败

1. **provider 无响应 / 401 / 429 / 5xx / schema 不兼容：** 展示数据源错误，保留上次成功数据与时间并按阈值标过期；不生成全部服务宕机事件。HTTP 401 要标身份配置问题，不能永久自动重试掩盖配置错误。
2. **provider 返回新鲜 down：** 判断是否为目标失败。UptimeFlare 已知 `location=ERROR` 与代理错误说明优先归为探测异常；消息文本不是稳定协议，因此未经明确分类的异常不可制造确定性宕机结论。长期应在只读导出层增加机器错误分类。
3. **缺少某 monitor：** 保留目录项并显示关联缺失；不同于下架服务。重复 ID、缺少时间、未来时间、非法数值均作为契约错误处理。
4. **探测位置切换 / fallback：** 显示实际位置与来源变化，禁止把单地恢复解释为所有地区恢复。
5. **前端离线：** 显示浏览器离线或加载失败；不重写监测后端的服务健康历史。

### 内网与 SSRF

目录外链可以指向管理员允许的内网用途，但公开内容默认不包含私网地址、管理端口与主机拓扑。公有云 Worker 不能因用户浏览器在内网就获得相同访问能力；内网监测需要部署在相应网络位置的受控 monitor/agent。不要为了探测给 LifeOS 暴露任意 URL 代理。

如果未来 LifeOS 服务端发起拉取，必须由管理员预配置 provider 与 monitor，访客只能传稳定 ID。对 scheme、目标 host/port、DNS 解析结果、IPv4/IPv6、每次重定向执行许可检查，拒绝环回、链路本地、云元数据与未授权私网地址；合法内网使用单独明确的允许目标和连接器。限制超时、响应大小、重定向次数、并发和速率，禁止 `file:` 等非所需协议。对批准的内网监测与公网 provider 拉取采用不同策略，不能用「屏蔽所有私网」取消已批准业务，也不能默认允许整个私网。

以上是 LifeOS 新增网络能力的设计/验收要求，不是在未经复现时宣称五个上游存在 SSRF 漏洞。首期只读公开适配也需防止用户输入变成服务端任意目标。

### 公开字段和通知

公开 DTO 采用字段白名单：已发布服务 ID/名称/描述、允许公开的入口、规范化状态、公开时间、允许的粗粒度探测位置及已审查事件文案。请求 header/body、目标私网地址、代理 URL、Webhook、响应正文、原始异常堆栈、管理员字段与会话不进入公开快照、日志或 CI 产物。对 UptimeFlare `message` 不直接透传；Kuma 公开心跳清空 msg 的实现提供了具体参考。[F5][K3]

提醒首期继续由监测后端承担，LifeOS 展示结果及事件；需要统一提醒时再建立独立事件接入任务。必须保留宽限期、失败重试、重复事件去重、维护抑制、恢复提醒和 webhook 发送结果。浏览器关闭后仍需提醒，因而不能把通知调度放进 React 定时器；本次不发送测试消息或启用真实提醒。

## 7. OS 原生落地方式

按现有 [UI 规范](../../concept/design-system.md)，服务视图位于综合看板同一个进程/窗口，沿用系统字体、主题、方形边界、工具栏、地址栏和状态栏，内容随窗口自然换行/滚动。建议默认使用紧凑服务列表：名称、用途、分类、状态文字、更新时间、打开入口；详情展示监测来源、位置、方法、最近观测、维护与关联主机。服务与服务器之间使用实体链接，不重复创建第二份主机数据。

只借鉴分组、搜索、筛选、连接测试、历史语义。不得 iframe 嵌入现成看板作为正式 UI，不迁入独立品牌侧栏、大圆角卡片、渐变背景、主题编辑器或额外移动外壳。状态必须有文字及可辨标识，不能仅使用红/绿；加载、无数据、未监测、失联、过期、维护都具有各自文案。配置管理按已确认系统设置/管理员入口安排，普通看板不自行增加设置按钮。

本次没有浏览器界面实现，也没有截图对照验证；这些是后续 UI 验收项。

## 8. 建议拆分的实施阶段与可观察验收

父议题保留三类目录：服务目录、可用性数据、主机探针。详细调研放评论/本报告，实施 Issue 单一职责。下面顺序适合纳入综合看板总计划，具体编号由协调者统一维护。

| 阶段 | 独立交付 | 依赖与验收 |
| --- | --- | --- |
| S1 服务目录与公开 DTO | 目录模型、稳定 ID、双语、排序、搜索、发布/下架、可选主机引用 | 依赖综合看板底座与内容权限；公开快照只含 published + public 白名单字段，未监测可独立展示；目录名称修改不丢失关联 |
| S2 状态契约与 UptimeFlare adapter | schema 校验、来源时间、freshness、错误分类、维护、公开 monitor 过滤 | 固定本报告 SHA 的 fixture 与真实隔离实例验证；不把三分钟落盘周期误判成失联，API 私有 monitor/消息不泄漏；上游变化时明确失败 |
| S3 独立监测与数据发布验证 | 经批准的目标清单、公开出口、运行位置、持续检查、额度与回滚证据 | 需要真实目标/部署范围决定；关闭 LifeOS 页面后仍采集；停止 provider 后只标来源失联；保护既有服务与域名 |
| S4 Kuma / 内网适配（需求触发） | 状态页元数据、心跳、事件历史、内网网络视角 | 仅实际需要多协议/内网时实现；不重复先建整套 Homarr 等门户；验证 CORS/服务器端代理、缓存、状态码及私有字段边界 |
| S5 历史与统一事件（单独能力） | 事件/维护详情、可用率口径、按来源留存、提醒联动 | UptimeFlare 当前摘要 API 不足，先定导出/采样契约；合成故障与维护测试确认分母、缺口、去重、时区和恢复消息 |

### 必须落到测试或实际验收的场景

| 输入 / 操作 | 可观察结果 |
| --- | --- |
| 没有 monitor 的已发布服务 | 目录正常显示，状态为未监测，入口可用，不伪造在线 |
| provider 从未成功，或首次返回无数据 | unknown / 数据源提示，不能显示绿色正常 |
| UptimeFlare `updatedAt` 为 2 分钟前，配置为默认 3 分钟持久化 | 不仅因超过一分钟标 stale；显示实际源时间 |
| 拉取成功但源 `updatedAt` 长期不变 | 超出配置阈值后显示 stale，拉取时间不替代观测时间 |
| provider 401、429、超时、坏 JSON、字段类型错误 | 来源错误可见，已有目录不消失；最后状态与新鲜度分开显示 |
| Globalping/proxy 失败、位置为 ERROR | 显示探测异常，不能把它等同目标 down |
| Kuma 返回 0/1/2/3，或未知状态码 | 分别 down/up/pending/maintenance；未知码显式 unknown + 契约问题 |
| 某个外部 monitor ID 被删除、重复或改名 | 关联缺失/重复错误可见，名称变化不创建新服务；其他服务保留 |
| 维护覆盖一个 monitor，同时另一个失败 | 维护范围准确，未覆盖失败仍可见；事件历史不被维护擦除 |
| 私有 monitor 在 UptimeFlare 页面分组隐藏但仍在 API 中 | LifeOS 公开白名单过滤；浏览器网络响应与导出产物均不含该项 |
| 原始异常包含私网地址、请求 header、token 或 HTML | 公开 DTO 不含敏感内容；文案作为文本处理，不执行 HTML |
| HTTP endpoint 重定向到环回/元数据/未批准私网，含 IPv6 或 DNS 变化 | 服务端连接器在发送请求前及重定向时拒绝，不返回目标正文 |
| 关闭看板页面，再使隔离测试目标失败与恢复 | 独立后端继续记录；按已配置宽限期/维护规则处理通知，不能靠页面轮询制造通过 |
| 同一服务公网检查失败、内网检查成功 | 两个观测位置清楚显示，综合摘要按约定标部分异常，不用一次成功覆盖失败 |
| 中英文、键盘访问、窄窗口、最大化/还原 | 与 daedalOS 控件与窗口规则一致，状态文字/来源时间可读，原生 App 未受样式影响 |

## 9. 需要产品决定的输入与本期限制

真实服务目录、可公开字段、目标网络范围、是否已有 UptimeFlare/Kuma 实例、期望的监测/历史保存周期与提醒渠道尚未由本研究获得。它们影响 S3 的实际部署；S1 和契约实现可先用明确标记的合成夹具推进，不能将其发布为用户真实服务。

UptimeFlare 已被原 Issue 列为参考，但不等于部署账户、付费资源、域名、生产目标与提醒发送已获授权。本研究完成源码/文档核验，没有运行五个项目，没有实测地域网络、云免费额度、生产 CORS、吞吐、恢复耗时或真实告警送达。README 的性能/容量主张仅作为待验收输入。公开历史、内网代理和统一提醒均不应伪装成当前 JSON 摘要天然具备的功能。

## 一手来源索引

所有项目源码链接固定到本次 SHA；Issue 与安全公告为官方记录。维护表来自 GitHub `repository.defaultBranchRef`、`releases`、`licenseInfo` 查询，部署前需再次核验实际采用版本。

[I1]: https://github.com/HuangYincan/idea/issues/9
[I2]: https://github.com/Hi-Yincan/LifeOS/issues/32
[I3]: https://github.com/Hi-Yincan/LifeOS/issues/32#issuecomment-6244747944
[H0]: https://github.com/gethomepage/homepage/tree/51cc1684f9f34a7877ed462b8f94c9cc687b4dde
[H1]: https://github.com/gethomepage/homepage/blob/51cc1684f9f34a7877ed462b8f94c9cc687b4dde/README.md
[H2]: https://github.com/gethomepage/homepage/blob/51cc1684f9f34a7877ed462b8f94c9cc687b4dde/docs/configs/services.md
[H3]: https://github.com/gethomepage/homepage/blob/51cc1684f9f34a7877ed462b8f94c9cc687b4dde/src/pages/api/ping.js
[O0]: https://github.com/homarr-labs/homarr/tree/69e3976297b0f7df9aec42c61ecfd82dbd100de3
[O1]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/apps/nextjs/README.md
[O2]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/apps/docs/docs/getting-started/installation/docker.mdx
[O3]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/apps/docs/docs/management/api/index.mdx
[O4]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/packages/integrations/src/uptime-kuma/uptime-kuma-integration.ts
[O5]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/packages/cron-jobs/src/jobs/ping.ts
[O6]: https://github.com/homarr-labs/homarr/blob/69e3976297b0f7df9aec42c61ecfd82dbd100de3/packages/integrations/src/uptime-kuma/uptime-kuma-types.ts
[D0]: https://github.com/Lissy93/dashy/tree/a0005e8d6ea3dad611bc7c4daa1cd837dd338c79
[D1]: https://github.com/Lissy93/dashy/blob/a0005e8d6ea3dad611bc7c4daa1cd837dd338c79/README.md
[D2]: https://github.com/Lissy93/dashy/blob/a0005e8d6ea3dad611bc7c4daa1cd837dd338c79/docs/status-indicators.md
[D3]: https://github.com/Lissy93/dashy/blob/a0005e8d6ea3dad611bc7c4daa1cd837dd338c79/docs/api.md
[D4]: https://github.com/Lissy93/dashy/blob/a0005e8d6ea3dad611bc7c4daa1cd837dd338c79/services/endpoints/status-check.js
[F0]: https://github.com/lyc8503/UptimeFlare/tree/520c0b8dcfcedf8e147863482a490f42af1a76e3
[F1]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/README.md
[F2]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/deploy.tf
[F3]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/worker/src/index.ts
[F4]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/worker/src/monitor.ts
[F5]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/pages/api/data.ts
[F6]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/uptime.config.full.ts
[F7]: https://github.com/lyc8503/UptimeFlare/blob/520c0b8dcfcedf8e147863482a490f42af1a76e3/middleware.ts
[F8]: https://github.com/lyc8503/UptimeFlare/security/advisories/GHSA-36q9-v7p3-vj6v
[K0]: https://github.com/louislam/uptime-kuma/tree/b092505f894d66669b67f46e1da72b51016eceab
[K1]: https://github.com/louislam/uptime-kuma/blob/b092505f894d66669b67f46e1da72b51016eceab/README.md
[K2]: https://github.com/louislam/uptime-kuma/blob/b092505f894d66669b67f46e1da72b51016eceab/server/routers/status-page-router.js
[K3]: https://github.com/louislam/uptime-kuma/blob/b092505f894d66669b67f46e1da72b51016eceab/server/model/heartbeat.js
