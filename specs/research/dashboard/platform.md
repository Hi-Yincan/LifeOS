# 综合看板：LifeOS 平台接入、数据契约与公开边界

核验日期：2026-10-18。源码基线：`dba64cb0181bde7e8dc1f1610263d9a2c6983267`。本报告只审阅该提交的正式源码与规范；以下文件行号均相对这个提交。没有构建、启动服务、读取个人运行数据或验证线上管理能力。产品方案标为“建议”，不把它写成已实现功能。

本次研究服务于综合看板父议题 #36：个人状况、会员、自建服务、服务器探针在一个原生 React App 内呈现。#37 的当前要求包括活动/安排/位置轨迹、日常生理数据与低频体检，以及逐功能公开开关、历史范围和公开延迟；#32 覆盖自建服务目录、可用性与服务器情况。Issue 范围由协调者在同日读取后提供，本报告主要核验平台能怎样承接这些要求。

## 1. 结论与实施边界

LifeOS 已有可复用的原生进程、单实例窗口、开始菜单、桌面快捷方式、商店分类、Surface、双语上下文、单密钥管理入口及本地内容发布流程。综合看板应注册一个 `Dashboard` 进程，在其中组织“总览 / 个人 / 会员 / 服务 / 服务器”视图；模块、图表和编辑器共享原生控件，不分别安装多个前端产品，也不复制参考项目的整套皮肤。

主要新增能力不是窗口外框，而是经过权限检查的数据读取、连接器、时间序列、公开策略及其投影。现有 `server/service.mjs` 只实现作品集本地开发服务；没有看板实体、定时采集、探针接入、生产会话存储或时间策略。当前 Pages 只能交付静态访客内容。浏览器打开后轮询第三方接口，不能代替全天候采集、保密凭证和服务器裁剪。

管理登录继续由“开始菜单 → 系统设置 → 站点维护”完成。登录后的业务编辑可以位于看板 App 内；公开规则、数据源与业务记录是看板的管理内容，不需要再造登录表单或另加 OS 设置按钮。现有登录完成后打开 Portfolio 的硬编码需要变成可扩展的业务入口。

用户要求先完成研究和 Issue，再开发。建议先固定共享契约及验收例，再安排原生 App 与本地服务实现；生产 24 小时后端、真实设备凭证和资源配置是后续明确实施条件。#31 的导出工作尚未合入本基线，不能把另一个工作区的未提交实现当作依赖已经可用。

## 2. 当前源码证据

| 能力 | 精确证据 | 对看板的影响 |
| --- | --- | --- |
| 原生进程注册 | `contexts/process/directory.ts:7`、`:231`、`:330` | AppStore、Portfolio、SystemSettings 均通过 dynamic React 组件与固定默认尺寸注册；自有窗口使用 `#202020` 和 `singleton: true`。Dashboard 采用相同机制。 |
| 单实例与启动 | `contexts/process/functions.ts:54`、`components/system/LifeOS/useLaunch.ts:5` | `openProcess` 处理 singleton；`useLaunch` 对已打开实例恢复最小化、前置并聚焦。普通入口需要走统一启动方式。 |
| 通用 App 深链接 | `hooks/useUrlLoader.ts:34`、`:50`；`pages/index.tsx:14` | `?app=` 从注册目录解析、等待会话和文件系统；不传 App 参数时默认桌面。新进程不需要改变默认进入行为。 |
| 作品集专用路由 | `components/system/LifeOS/context.tsx:254`、`:386`；`components/system/LifeOS/Shell.tsx:6` | 全局 `route` 只理解 `project/view`，`navigate` 固定写 `app=Portfolio`，Shell 只桥接作品集。看板不能直接复用这组业务路由。 |
| 商店目录 | `components/apps/AppStore/catalog.ts:145` | 从进程目录自动生成，缺少 description 会抛错，应用软件分类当前仅包含 AppStore/Portfolio。注册 Dashboard 时必须同时添加中英描述和分类。 |
| 商店语言与窗口标题 | `components/apps/AppStore/index.tsx:148`、`:164` | 从 `useLifeOS().locale` 选择本 App 的双语词典，通过进程 `title` 更新窗口标题，可作为看板参考。 |
| 桌面与开始菜单 | `public/Users/Public/Desktop/Portfolio.url:1`、`public/Users/Public/Start Menu/Portfolio.url:1`；`components/system/StartMenu/index.tsx:154` | `.url` 中的 `BaseURL` 指向进程；开始菜单读取标准文件夹。应维护源快捷方式，不手改生成索引。 |
| 索引生成 | `scripts/cacheShortcuts.js:8`、`:32`；`scripts/product/build.mjs:17` | 构建重建快捷方式缓存、图标和文件系统索引；入口和图标变化需要真实构建与双击验收。 |
| 系统设置入口 | `components/system/StartMenu/Sidebar/index.tsx:65` | Settings 与 Power 独立；普通 App 无需新增齿轮或密钥入口。 |
| 已有认证 UI | `components/system/LifeOS/Settings.tsx:76`、`:82`、`:114`、`:121` | 静态模式只显示不可管理说明；本地 POST session 后固定打开 Portfolio。需要统一业务入口/返回目标，保留单密钥表单。 |
| 全局语言与会话 | `pages/_app.tsx:24`；`components/system/LifeOS/context.tsx:264`、`:310`、`:336` | 根部已有 Provider；`zh/en/auto` 为当前语言范围，静态模式不请求 session。日期时区与语言偏好不能混为一个设置。 |
| 请求抽象 | `components/system/LifeOS/context.tsx:351` | 当前统一同源 request 注入 CSRF，401 清除 admin；静态模式拒绝写入。未来跨 origin API 不能只换 URL 而保留所有同源假设。 |
| 静态资源映射 | `components/system/LifeOS/deployment.ts:1` | 当前只映射 `/api/profile` 和 `/api/projects`；未知资源明确抛 `READ_ONLY_DEPLOYMENT`。新增 Dashboard 必须声明自己的 capability/资源，不能静默落到无后端 API。 |
| 原生表面与控件 | `components/system/LifeOS/Surface.ts:6`；`components/apps/Portfolio/index.tsx:564`；`components/apps/AppStore/index.tsx:12` | 复用字体、颜色、选中态、ScrollBars、StyledNavigation、StyledAddressBar、StyledStatusBar、Button。 |
| 样式范围 | `components/system/LifeOS/lifeos.css:1`、`:20`、`:45` | 现有自有 App 样式限制在 `.hyc-surface`，网格按可用宽度自然换行。Dashboard 样式仍需自己的根范围。 |
| 未保存关闭保护 | `components/system/LifeOS/closeGuards.ts:1`；`contexts/process/useProcessContextState.ts:103`；`components/apps/Portfolio/index.tsx:86` | 看板编辑器可注册现有 guard，同时处理浏览器退出；切模块、切记录、登录失效也应保留未保存内容。 |
| 本地存储与会话 | `server/service.mjs:14`、`:18`、`:21` | JSON 文件替换写入；会话与限速 Map 在进程内存中。不是数据库事务、持久会话或多实例协调。 |
| 本地访问限制 | `server/start.mjs:8`、`:14`、`:18`；`server/service.mjs:47` | 绑定 127.0.0.1，运行数据在忽略目录，Host 只接受本地地址。不能直接把此启动脚本暴露到生产。 |
| 本地鉴权 | `server/service.mjs:22`、`:53`、`:55`、`:80` | 有 no-store、Origin、单密钥限速、HttpOnly/SameSite Cookie、管理路由会话及 CSRF 检查；这些只证明本地机制存在。 |
| 作品集发布 | `server/service.mjs:68`、`:75`、`:88`、`:99` | 访客读发布快照；图片按发布引用/会话检查；版本冲突为 409；草稿与发布记录分开。看板应继承显式投影原则，但不能复用作品集实体。 |
| 静态导出 | `scripts/product/export-public-content.mjs:7`；`scripts/product/public-content.mjs:3` | 只读已提交 seed；逐层选择公开字段和双语字段；本地 imageId 会被拒绝。没有看板和动态隐私时间模型。 |
| Pages 产物边界 | `scripts/product/package-pages.mjs:18`、`:25`、`:47` | 校验公开 JSON、无 runtime/api/private、无符号链接；CI 要求提交状态。需要增加看板文件白名单与敏感字段扫描。 |
| 现有回归入口 | `server/test/public-content.test.mjs:7`；`server/test/content.test.mjs:36`、`:104`；`e2e/product.spec.ts:4`、`:228`；`e2e/public.spec.ts:3`、`:62` | 有公开字段、会话/发布、默认桌面、管理和静态无 API 测试；尚未覆盖看板，不能继承旧结果作为看板验收。 |

源码与当前文档一致地把 server 定义为本地服务：`server/README.md:3`、`README.md:15`。旧概念材料中的“建议 PostgreSQL/S3/多节点”是规划，不能写成现状。当前生产模式依据仓库发布规范 `specs/deployment/pages.md:5` 与构建代码核验；本报告没有重新验证线上 release.json。

## 3. 原生 App 接入方案

建议模块边界如下，路径只是后续实现的规划，不表示已创建：

| 范围 | 建议职责 | 共享文件所有者 |
| --- | --- | --- |
| `components/apps/Dashboard/` | App 壳、模块导航、总览卡片、各模块视图、业务编辑、状态反馈 | App 集成实施者；模块可在稳定接口后分工 |
| `components/apps/Dashboard/messages.ts` | 看板 UI 的 zh/en 词条、错误与状态说明 | App 集成实施者 |
| `components/apps/Dashboard/model/` | 前端公开/管理 DTO、格式化、查询状态；不放密钥和权限决策 | 契约实施者 |
| `server/dashboard/` | 领域服务、查询与公开策略、管理 API、连接器接口 | 服务端实施者 |
| 进程、商店、路由、快捷方式、LifeOS context/Settings | OS 接入；不与各模块同时写 | 唯一系统集成实施者 |
| 导出器、媒体出口与 schema 迁移 | 复用统一公开投影；协调 #31 合并后的接口 | 唯一导出/迁移实施者 |

实施清单：

1. 在进程目录新增一个 `Dashboard`，设置单实例、中性背景和原生默认尺寸；总览及模块只改变 App 内容，不增加独立窗口系统。首次进入仍显示桌面。
2. 商店增加双语说明，归“应用软件”；从商店、开始菜单和明确深链接进入同一实例。桌面新增入口是否默认展示应在 PRD 与 Issue 中明确，不把用户要求一个 App 自动解释为增加一排模块图标。
3. 深链接建议 `?app=Dashboard&dashboard=personal` 或等价的专属参数；实体 ID 仅引用可公开对象。浏览器前进/后退、刷新、同一实例切模块需要覆盖。保留作品集原参数和无参数桌面。
4. 复用 Surface 与上游工具栏/状态栏；内容区域可用紧凑模块导航、筛选栏、列表、图表和详情。数值图使用相同主题色、明确单位、文字状态与表格替代；不以颜色作为唯一状态线索。
5. 中英文 UI、日期/数值格式与业务时区分别处理。`locale` 改变显示语言，不改变“今日”“延迟 1 天”或账单周期边界。货币保留 ISO code，金额与汇率、原币/展示币分别表达。
6. 未公开/无数据/加载/错误/过期/不支持/尚未配置必须可区分。未公开数据不通过“隐藏卡片”伪装授权；访客请求本身不应取得该字段。
7. 管理者在看板内编辑模块、数据源、记录与公开规则。系统设置负责会话与全局语言；登录后允许回到已请求的已知业务 App 或展示管理入口列表，目标从进程白名单选择，避免任意跳转。
8. app 内导航、关闭、注销、401 和远端版本变化都要明确处理未保存数据。角色降为 visitor 时清除内存中的已加载私有查询结果与图表缓存，不把私有草稿写到浏览器持久存储来“方便恢复”。

现有 `LifeOSContext` 混合 Portfolio 类型、路由、翻译、认证与全局偏好。建议只抽出确有多个应用使用的会话/请求/语言能力，Portfolio 专属路由留在原模块；不要为了 Dashboard 将所有业务数据塞进根 Provider。图表库或日期库的选择等到模块需求、包体积和无障碍试验后确定；本报告没有批准依赖升级。

## 4. 共享数据契约

一个 App 不意味着一个无约束 JSON 大对象。建议保留各模块的领域实体，共享连接器、策略和返回元数据。

| 契约 | 建议字段与边界 |
| --- | --- |
| DashboardConfig | schemaVersion、version、模块顺序/启用状态、公开模块标题；布局偏好和公开策略分开。 |
| DataSource | 稳定 id、adapter kind/version、能力、采样/抓取计划、私有 secretRef、最近成功/失败/下次重试；公共 DTO 不含 endpoint 凭证、原始错误堆栈和内网地址。 |
| SourceCapability | 是否提供 history、可靠 observedAt、原始分辨率、延迟、分页、webhook/poll、可用聚合与健康状态；前端只对确有数据的能力提供交互。 |
| Observation | sourceId、稳定 sourceRecordId、metricId、value/unit、observedAt（可空）、periodStart/periodEnd、receivedAt、质量与修订版本。领域实体保存特有字段，不用所有业务共用的任意 key/value 取代模型。 |
| Domain entities | PersonalEvent/LocationSample/HealthObservation、Membership/PaymentOrRenewal、Service/MonitorObservation、Server/ResourceSample 分别定义；活动、账期、探测与 CPU 样本不能仅靠同名 `status` 相互转换。 |
| PublicationPolicy | moduleId/metricId、是否公开、historyWindow、delay、excludeToday、policyTimeZone、允许的分辨率/聚合/字段、policyVersion。公开规则是服务端数据，不存 localStorage。 |
| PublicProjection | schemaVersion、policyVersion、允许的模块/字段、时间范围、数据和 freshness 元数据；生成时就完成去标识、字段筛选与时间裁剪。 |
| PrivateMigrationExport | schemaVersion、稳定 ID、业务记录、来源/修订与必要策略；单独授权、单独文件、不可公开；不含 session、密钥或连接器凭证。与 #31 未来契约对齐。 |

建议公共 envelope 至少区分：

```ts
type PublicEnvelope<T> = {
  schemaVersion: number;
  policyVersion: number;
  generatedAt: string;
  expiresAt: string;
  window: { from: string | null; toExclusive: string; timeZone: string };
  freshness: {
    state: "fresh" | "stale" | "unknown" | "unavailable";
    sourceUpdatedAt: string | null;
    fetchedAt: string | null;
    observedAt: string | null;
    expectedIntervalSeconds: number | null;
  };
  data: T;
};
```

这是待进一步落实的 DTO 草案；字段只在允许公开时出现，不因为它叫元数据就默认公开。`generatedAt` 表示本次投影，`sourceUpdatedAt` 表示源快照更新时间，`fetchedAt` 表示读取时间，`observedAt` 表示实际测量时间。不能用抓取时间替代未知的测量时间，页面也不能把“刚刚获取”显示为“刚刚测量”。私有数据源的抓取次数、失败原因或最新健康数据时间本身也可能泄露活动，公开 envelope 必须仅表达公开部分。

freshness 与业务状态分开：服务可以“上次探测正常，但数据已经过期”；会员可以“已到期，数据仍是新鲜的”；服务器离线与采集器掉线也不能混为一谈。是否 stale 由 adapter 的有效刷新、持久化及业务时效模型计算，不采用全站固定 60 秒。源只给当前值时不能合成历史；图表缺口保持缺口，0、null、未公开、不支持分别表示。

连接器只负责读取、校验、归一化与去重。内部凭证在服务端保存，前端只收脱敏连接状态；管理者的录入/导入也经过同一领域校验。幂等键采用 sourceId＋sourceRecordId/业务时间＋版本的明确组合，补传、重试和修订不会重复计数。数据质量需表示缺失时间、单位错误、未来时钟偏移、重复、撤回；未知单位或不能确定时间语义的样本不应被静默转换成有效图表。

建议将读取、写入、采集凭证分开：访客接口只返回公开 DTO；管理接口检查现有作者会话与写保护；采集器使用独立限定 source 的凭证，不能获得作者全部权限。接口示例可用 `/api/dashboard`、`/api/dashboard/modules/:id`、`/api/admin/dashboard/...`、`/api/ingest/...`，命名最终由契约任务统一，不让各模块自行定义冲突的 endpoint。

## 5. 公开时间策略的精确定义

下述语义是建议写入 PRD 的可执行约定；它解决 #37 提出的范围组合，不能只做几个前端下拉框。

### 5.1 时间与继承

- 记录时间统一存储为带 UTC 偏移的标准时间，保留来源时区与时间依据。服务端使用可信时钟计算权限；访客电脑时间不能扩大可见范围。
- `policyTimeZone` 是作者指定的 IANA 时区，决定日历日与月份边界。语言切换、访客所在时区和设备时区不会改写策略；首个真实数据源接入前必须确定站点策略时区。
- 模块开关是上限，指标/字段可进一步收紧；任一层关闭即不公开。未设置规则的新增指标建议默认私有，由管理者显式选择。
- “全部历史”指服务端现存、经其他规则允许的数据，不代表永久保留或能恢复从未采集的数据。存储保留期限与访客可见期限是两项独立策略。

### 5.2 截止时间与历史范围

设 `N` 为服务端请求时间。滚动延迟 `D` 可为 0、24 小时或 7×24 小时，得到候选截止 `C1 = N - D`。若勾选“不展示今日”，令 `C2` 为 `N` 在 policyTimeZone 中当天 00:00 的 UTC 时刻；最终 `C = min(C1, C2)`。未勾选时 `C = C1`。请求时按 `[from, C)` 半开区间裁剪：开始时刻可见，截止时刻尚不可见。

历史窗相对 **可公开截止 C** 计算，不能相对 N 计算，否则“显示 3 天＋延迟 7 天”会得到空集。建议“1 天 / 3 天”在产品文案明示为“最近 24 小时 / 最近 72 小时”；若产品要显示完整日历日，应另用日历窗类型，不复用同一数值。“1 个月”建议采用策略时区中的一个日历月回退并对月末截断；如选择固定 30 天，则 UI 必须明确写“30 天”。没有记录早于 from 时就返回实际已有部分，不补造样本。

| 场景 | 固定输入 | 应返回的范围与结果 |
| --- | --- | --- |
| 历史 3 天＋延迟 7 天 | N=`2026-10-18T12:00:00Z`，历史=72h，D=168h，不排除今日 | C=`2026-10-11T12:00:00Z`，from=`2026-10-08T12:00:00Z`；10 月 8 日 12:00 样本包含，10 月 11 日 12:00 样本排除。 |
| 不展示今日 | N 同上，时区 Asia/Shanghai，D=0，历史=24h | 当地当前为 10 月 18 日 20:00；C=`2026-10-17T16:00:00Z`，from=`2026-10-16T16:00:00Z`。公开完整的当地 10 月 17 日。 |
| 滚动延迟 1 天 | N 同上，D=24h，历史=24h，不排除今日 | C=`2026-10-17T12:00:00Z`，from=`2026-10-16T12:00:00Z`。与“不展示今日”差 4 小时，不能标为同一种选项。 |
| 全部历史＋延迟 1 周 | N 同上，from=null | 只返回 C 之前、仍保留且其他策略允许的数据；不得在卡片、图表最新值或计数中带出 C 以后的记录。 |
| 1 个日历月 | C 的本地时间为 2026-03-31 10:00 | from 为同一时区 2026-02-28 10:00；另测试闰年、夏令时切换及月初。时差不固定为 30×24h。 |

活动区间、睡眠区间、一天汇总和服务器统计采用明确的 periodStart/periodEnd。默认只公开完整落在窗口内的区间；若业务允许部分区间，先裁剪原始样本再重新聚合，并标注实际覆盖范围，不直接展示跨过边界的整夜睡眠、日均心率或日均 CPU。历史窗口/延迟不仅作用于列表，也作用于当前卡片、分布、趋势、最大/最小、总数、搜索结果和下载。

计划中的未来日程、会员续费日期与服务器到期日期是业务字段，不是传感器采样时间。是否公开未来安排、具体时间/地点、账期与金额需要各自字段规则，不能用“当前快照已公开”推导出整个未来日程可公开。不同类型保留不同的 temporal basis，不让统一时间筛选错误删除所有未来续费提醒。

### 5.3 时间不可靠与重新计算

补传数据按真实业务时间进入历史，不因今天收到就伪装成今天发生。可靠 observedAt 缺失时，不能判断事件已经满足某个延迟；可按已定义的 adapter 规则用 receivedAt 作为保守披露起点并显式标注“接收时间”，或保持该指标未公开，不能静默代填测量时间。来自设备的异常未来时间需隔离/标记，不让它使条目永不退出窗口或绕过延迟。

公开投影应在读取时执行策略，或由后台生成带有效期的物化投影并在读取时再次验证 policyVersion 和时间。策略变更、日界线、样本进入/离开范围、源记录修订/删除、采样数据失效都触发失效或重算。批量聚合必须只包含允许的样本；公开一个小时聚合并不自动允许下载该小时原始点。

## 6. 隐私、导出与撤销

建议建立单一服务端 `projectPublicDashboard(records, policy, now)` 规则边界，网页读取、总览聚合、模块详情、图表查询、图片/地图资源、JSON/CSV 导出和静态快照均调用或使用它产生的结果。公共字段采用逐层白名单；绝不先返回全量数据再让 React 依 visibility 隐藏。

必须覆盖的推断途径包括：公开卡片只剩 1 项但计数泄露总数；在隐藏时间段中计算的平均值/趋势；定位轨迹经过家庭地点；地图缩略图仍包含精确点；截图/附件中的姓名、医院号、账户；监控错误消息中的 token、完整 URL、IP；sourceUpdatedAt 暗示私有活动。记录不可访问时，公共详情使用一致的不可用行为，避免枚举具体隐藏实体。地理粗化不等于匿名，是否允许城市级位置、轨迹精度、健康原值与体检附件分别在模块 Issue 决定。

| 层 | 建议行为 | 不能承诺的事 |
| --- | --- | --- |
| 管理响应 | 禁止公共缓存；敏感表格和草稿只在受控会话内存存在；退出清空 | HttpOnly 不会阻止同源脚本借管理员会话调用 API。 |
| 动态公开读取 | 每次验证当前规则；若使用缓存，key 包含 policyVersion/投影版本/允许范围；收紧规则后同步停止旧投影被新请求读取 | 只改前端开关或仅换 URL，不能撤回仍可直接访问的旧 URL。 |
| 有效期 | envelope 带 expiresAt；客户端到期后隐藏旧内容并重新验证，断网时显示不可用说明 | 浏览器 JS 隐藏不是访问控制；到期仍可下载的静态文件依然是公开数据。 |
| 服务端/CDN 缓存 | 明确 TTL 上限、失效接口、策略变更时的响应行为；失败时关闭受影响公开读，不无限返回 stale 敏感结果 | “立刻撤销”只有在所有受控新请求路径实际阻断后才成立；有 TTL 时要报告最大传播时间。 |
| 静态快照 | 只导出作者愿意以公开文件方式发布的内容，固定生成时间/政策版本；可显示“截至某时”的状态 | GitHub 历史、Actions 产物、CDN、浏览器缓存或第三方已下载副本不能靠本地设置收回。 |
| 新生成导出 | 获取当前策略后在服务端裁剪；默认公共导出不携带私有数据 | 管理者以前手工下载的文件、用户截图或复制的数据无法远程撤回。 |
| 私有迁移备份 | 独立于公共包，记录 schema 与稳定 ID；加密/授权交付与恢复验证另行实施 | 把私有备份交给公开仓库或 CI 后，排除几项字段无法恢复保密性。 |

`expiresAt` 应不晚于下一次策略/窗口/数据时效变化和允许的最长缓存期限；HTTP Cache-Control 与实际代理配置也必须匹配。API 使用 no-store 可以降低正常缓存保留，但不能保证所有副本消失：RFC 9111 §5.2.2.5 明确说明 no-store 不是充分的隐私保护机制。现有本地 `no-store` 仅是一个响应头实现，不能据此宣称生产撤销已经完成。

对于必须按天自动延迟、自动缩短历史或随时关闭的个人指标，建议正式公开能力依赖动态授权出口。静态模式可展示空态/未配置、经明确同意的固定非敏感摘要以及低变动公开目录；不要把全部定位和健康历史写入 Git，再依赖定时构建隐藏。由 CDN 静态文件配合 expiresAt 的方案只能改善合规客户端展示，不能满足新请求严格撤销。

## 7. 本地、Pages 与生产服务的职责

| 能力 | 当前已实现 | 看板开发阶段建议 | 生产前需要 |
| --- | --- | --- | --- |
| 原生前端 | React/窗口/商店/语言/设置 | 一个 Dashboard，使用明确的 empty/error/readonly 状态 | 实际桌面、窄窗口、手机/iPad 和键盘验收 |
| 内容存储 | 本地 content.json，单进程内存状态 | 隔离看板测试数据；先确定 schema/迁移与仓储边界 | 持久存储、事务、备份恢复、迁移回退、并发一致性 |
| 认证 | 本地单密钥、内存 session/attempts | 复用管理流程与接口语义，独立采集凭证 | HTTPS、持久会话、轮换撤销、限速、审计、同源执行检查 |
| 采集 | 无看板采集器 | 先手工/文件导入，再实现一个可重复验证的 adapter | 全天候进程、调度/重试/幂等、凭证保管、可观测性和故障恢复 |
| 公开 | 构建 seed 的作品集白名单 | 实现共用投影与公共/管理 DTO 分离 | 动态时间策略、缓存边界、数据删除/撤销验收 |
| 部署 | Pages 静态访客版 | 保持现有部署模式；本地 API 做真实流程验证 | 另行确定服务器/API origin/资源与网络；不能因完成本地 App 自动上线后台 |

#31 的已确认流程是“本地编辑 → 导出公开配置与已发布媒体 → Agent 审查导入 seed/media → Pages”，另有无密钥会话的私有迁移备份；协调者在同日核验到其独立分支尚未提交。这是后续对齐目标，本基线的 export-public-content 仍只读 seed。看板需要给 #31 提供带 schemaVersion 的扩展包和媒体/数据白名单，等它合并后按真实接口接入，不复制其未提交代码、不替它修改文件。

迁移顺序建议：固定领域 schema 与版本 → 合成 fixture 和迁移测试 → 在已授权的本地备份上演练只读校验 → 显式导入独立存储 → 对账记录数量、时间范围、单位与稳定 ID → 验证公共投影 → 才切换读取。迁移不得自动读取整个 `server/.runtime`、用户浏览器文件系统或研究原型目录。生产回退不能只恢复前端 SHA，还需要确认新旧 schema 与公开策略兼容；收紧隐私规则后恢复旧代码不得重新放出历史数据。

## 8. 连接器与安全实施门禁

看板会处理健康、行踪、账户费用和基础设施数据，现有规范已经指出原生 App 的同源执行需要检查：`specs/concept/PRD.md:99`、`specs/concept/architecture-decisions.md:37`。本报告不声称已验证任意原生 App 的隔离。作者会话可读更多敏感内容后，应先审查本地 HTML、脚本执行、编辑器预览、Browser iframe 与第三方嵌入的可信边界；根据结果落实可证明的管理/私有数据来源隔离。独立 origin 若需要，应由同一原生窗口承载已授权的管理区域，不能因此改成一套新的产品皮肤或新增访客账户。

| 威胁/失败 | 需要实施的边界 | 验收焦点 |
| --- | --- | --- |
| 接口越权 | 公共/管理/采集分别验证；所有 module/metric 查询走服务端规则 | 伪造 role、直接请求隐藏实体、扩大 from/to、改 metricId 均不能取得私有数据。 |
| 服务探测变成 SSRF | 凭证化配置受信数据源，限制 scheme/host/port；解析与连接目标一致；禁止未验证重定向；限制出站网络 | IPv4/IPv6 回环、link-local、云元数据、DNS 变化、跳转内网；私网探测仅交给明确授权的私网 collector，不开放任意 URL 代理。 |
| 数据源凭证泄露 | secretRef 只在服务端解引用；错误/日志/URL/导出脱敏 | 构建、公开 JSON、浏览器网络、日志与 Issue 不出现 token。 |
| 重放/伪造采集 | source 级凭证、签名/时间窗或其他明确机制、幂等去重、来源限速 | 重复/乱序/过期/被撤销 agent 的上传不会污染历史或取得其他 source 权限。 |
| 网络失败与配额 | 有界超时、退避、抖动、并发上限、重试可观测 | 不把读取失败标成服务 down；断网后可恢复，不重复计费/累加样本。 |
| 资源/附件风险 | 大小/数量/解析限制，真实格式解析；健康附件只走授权出口 | 超大导入、异常单位、带脚本内容、地图/图表注入不能绕过校验。 |
| 多实例竞态 | 持久会话、事务写、policyVersion、任务租约与幂等 | 策略更新与在途采集/导出并发时不能发回旧的更宽松投影。 |

SSRF 建议以 OWASP 的可信目标 allowlist、重定向限制及网络层约束为依据。这里只定义自建服务集成的必要边界，不表示所有域名/内网目标都被用户授权，也不把访问公网 URL 的允许视为可扫描其网络。

## 9. 实现分期与验证矩阵

| 阶段 | 交付与完成条件 | 前置依赖/阻止事项 |
| --- | --- | --- |
| P0：规格完成 | #36 总目录、模块 Issue、隐私选项、数据源能力表、统一 DTO/错误与时间验收例；保留资料来源 | 当前研究阶段；真实账号、可穿戴型号/系统、策略时区、生产运行位置未确定的部分明确标记。 |
| P1：原生 App 与数据契约 | 单进程/单实例，五视图；双语、空/加载/错误/过期；本地合成 fixture 与公共 DTO；路由/入口不干扰 Portfolio | 先完成共享类型与系统接入所有者划分；不把合成数据当个人公开内容。 |
| P2：本地管理与公开策略 | 手工/文件导入、真实本地 API、业务编辑、单密钥会话、版本冲突、服务端时间裁剪、导出一致性 | 契约稳定；对齐合入后的 #31；不修改既有 runtime。 |
| P3：逐一连接器 | 每个 adapter 有能力声明、采样时间语义、凭证隔离、去重、重试及故障试验；服务/服务器/个人数据按授权接入 | 先有 ingestion 与存储边界；缺设备/API 条件的模块保留手工/未配置，不虚称自动同步。 |
| P4：常在线与生产门禁 | 存储/事务/备份恢复、会话撤销、来源隔离、出站约束、计划任务、隐私撤销及监控 | 需要明确部署与资源决定；维持当前 Pages 约束，独立实施生产后台。 |
| P5：发布与验收 | 公开导出/动态模式分别验证；回退不放宽隐私；记录真实设备与网络覆盖 | 生产发布仍需原有授权流程；普通源码 push 不上线。 |

| 验证层 | 必测场景 | 证据要求 |
| --- | --- | --- |
| 单元/契约 | schemaVersion、未知 metric、单位、币种精度、UTC/时区、3天+7天、今日边界、月末/闰年/DST、from/to 半开端点、未知 observedAt | 使用固定时钟与真实纯函数，不 mock 掉公开裁剪。 |
| 服务/授权 | visitor/admin/collector 三种权限、CSRF/Origin、401/403、409、隐私逐模块与指标、策略版本、补传/修订/删除 | 启动真实实现，检查完整响应体和状态；不能只断言 UI 隐藏。 |
| 聚合/导出 | 列表/卡片/图表/统计/媒体/CSV/JSON 使用相同允许集合，跨区间 bucket、全部历史、附件与 metadata 无泄漏 | 使用显式敏感哨兵字段和时间段，比较所有出口；公共产物不能含私有备份。 |
| 缓存与撤销 | 政策变更后的首次新请求、CDN/客户端过期、直接旧 URL、断网、在途导出、回退 | 记录实际配置、最大延迟、能否继续下载；区分受控新请求与已下载副本。 |
| 连接器 | 真实协议样例与受控测试端点、缺时间、坏响应、重复/乱序、重放、限流、DNS/重定向、失联后恢复 | 真实外部账号实测另标；fixture 通过不代表设备链路完成。 |
| 窗口/入口 | 桌面/开始菜单/商店/深链接、最小化恢复、重复打开、关闭保护、浏览器前进后退、刷新、默认桌面 | 实际浏览器；共享一个进程，不重复打开多个 Dashboard。 |
| UI/语言 | 五视图和编辑器，中英切换、键盘焦点、表格替代图、错误重试、空/不公开/未配置/不支持、窄窗口与最大化 | 对照同构建 File Explorer 的字体/表面/工具栏/状态栏，截图加交互证据。 |
| 静态/构建 | `--public` 无 session/管理 API/凭证请求；清洁产物仅含批准公开文件；旧站路径与原生 App 回归 | 在隔离 worktree 执行产品完整检查；不使用旧 CI 数量代替本次证据。 |
| 迁移/恢复 | #31 公开包与私有备份各自 round-trip、稳定 ID/版本、无凭证会话、失败保留原数据、schema 回退 | 对账记录与可重复恢复演练，不依赖 Git 保存运行数据。 |

本次为文档调研：检查文件/行证据、官方资料、报告链接及 `git diff --check`，不运行产品构建。后续产品改动应按 AGENTS.md 顺序运行适用的 build、lint、unit、server 和实际 Playwright；涉及公开导出时在隔离工作区单独跑静态模式。这里只给出应测矩阵，没有把任何未运行的产品检查写成通过。

本次实际验证：41 个完整文件/行号引用的路径存在且行号有效；Python 标准库 datetime/zoneinfo 复算了固定 UTC 与 Asia/Shanghai 时间例；两项均通过。`git diff --check` 通过。文档门禁另由并行工作流记录，产品、浏览器、真机与生产检查未执行。

## 10. 资料与证据范围

- 仓库规范：`AGENTS.md`、`README.md`、`maintenance/workspace.md`、`specs/concept/design-system.md`、`specs/concept/data-and-permissions.md`、`specs/concept/PRD.md`、`specs/concept/architecture-decisions.md`、`specs/concept/prototype-handoff.md`、`specs/deployment/pages.md`；与第 2 节源码一同于 2026-10-18 核验。
- GitHub Docs，What is GitHub Pages：`https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages`。同日读取，官方明确 Pages 为静态站点托管；本报告据此与本仓库的静态构建共同划分运行边界。
- IETF RFC 9111，§5.2.2.5 no-store：`https://www.rfc-editor.org/rfc/rfc9111.txt`。同日读取 no-store 响应指令及其隐私局限，支撑“响应头不能收回全部副本”的表述。
- OWASP SSRF Prevention Cheat Sheet：`https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html`。同日读取可信目标 allowlist、重定向、DNS 与网络层约束章节；用于服务探测 adapter 的实施门禁。

没有读取 `.runtime` 密钥、私人健康记录、会员账号、真实服务器管理凭证或 #31 未提交源码。没有创建/修改生产资源、域名、服务或 Issue。研究中的能力、限制与建议都只覆盖平台层，具体开源方案、许可证和接入可行性由相应模块报告给出。
