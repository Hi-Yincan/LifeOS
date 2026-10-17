# Personal OS v1 — 个人作品集 PRD

版本：1.3 概念修订稿 · 2026-10-17。来源：负责人本轮 11 项回答；关联 #2、#9–#15、#17。已确认的底座是 daedalOS，本文不重新选型。验收目标与实测结果分开记录，后者见研究原型的验证报告。

2026-10-17 变更依据：负责人确认取消额外手机/平板适配；作品集保留 Web 应用实现，只改视觉。旧 A/B 风格和三模式方案作废，历史证据留档。

### 1. Executive Summary

**Problem Statement**

访客需要快速理解作者做过哪些开源项目，并能进入源码或实际项目。网站同时应保留 daedalOS 作为可探索、可交互桌面的价值；不能为了个人展示把原有 App 大量删除，也不能用一批浅层自制 App 分散第一版质量。

**Proposed Solution**

第一版只新增一个业务 App“个人作品集”：进入网站后自动打开，包含概览、作品列表/详情、个人介绍与联系。保留现有 React Web 应用，使用 daedalOS 原生窗口与一致的应用视觉，提供中英双语内容及单密钥管理；保留全部原生 App，桌面、手机与平板全部沿用 daedalOS 原项目的响应式、窗口和任务栏行为，不再设计额外设备模式。

**Success Criteria（发布验收目标，不冒充当前测量结果）**

1. 首次访问无需登录，自动进入作品集；从初始作品集页面到任一作品源码或项目网站不超过 3 次点击，且链接可通过新浏览器会话直达同一作品。
2. 上游基线全部应用/进程注册保留（本次基线为 33 项，包含系统对话框）。所有公开入口逐项登记去留与可用性；没有未经确认的删除。
3. 作者可以在同一 App 内完成创建、编辑、排序、上传封面、保存草稿、发布和下架；匿名管理请求、私有备注和草稿媒体访问均被服务端拒绝。
4. 简体中文/英文切换、首访自动识别与偏好保存可复现；切换不丢失未保存表单，既有 App 可保持原语言但须明确范围。
5. 桌面 1440×900、手机 390×844/360×800、平板 820×1180/1180×820 的窗口与 OS 行为和同一上游基线一致，作品内容可浏览；不引入独立手机/平板桌面或强制全屏。真实设备与国内外网络的发布验收另行执行，仿真不能替代。

### 2. User Experience & Functionality

**User Personas**

| 角色 | 目标 | 权限与环境 |
| --- | --- | --- |
| 公开访客 | 了解项目、看作品细节、访问 GitHub/项目网站、探索 OS | 不需要账户；可以使用原生工具、编辑器、游戏；不能修改作者的已发布内容 |
| 作者 | 管理作品和双语资料、控制发布版本 | 设置内输入单一管理密钥，获得有期限的服务器会话；主要使用电脑 |
| 手机/平板访客 | 通过触屏完整浏览并分享内容 | 使用原项目的桌面、窗口和任务栏；按实际设备验证，不另造触屏系统 |

**范围及信息架构**

- OS：保留原桌面与 App 布局，增加作品集入口、系统设置能力、默认打开行为；系统设置入口位于开始菜单左侧栏，与 Documents、Pictures、Videos、Power 并列。设置属于系统增强，不增加第二个业务 App。
- 应用设置规则：应用默认不带设置按钮；仅当负责人明确要求应用专属设置时另行设计。系统设置独立于作品集，详见 `system-settings.md`。
- 作品集概览：简短介绍、精选作品、源码入口；项目和参与贡献明确区分。
- 作品列表：分类、关键词筛选、排序；不使用未经核实的“活跃用户”“影响人数”等展示指标。
- 作品详情：双语标题/摘要/背景/个人贡献/介绍、图片/视频、技术栈、源码与项目网站。无内容的可选区块不占位冒充事实。
- 关于：公开简介、已证实的教育信息、项目技术栈、联系方式。项目使用的语言不能自动宣称为作者的熟练技能；缺失专业、履历和具体贡献待补充。
- 管理：复用阅读布局进入编辑，具备草稿状态、发布状态、未保存提示、版本冲突与媒体访问控制。

初始内容来源为 `HuangYincan/HuangYincan`：AIPM、VideoNote-MCP 列于 Projects；Agentero、Multica 列于 Contributed To。公开邮箱为 `Yincan_Huang@zju.edu.cn`。不推断未提供的履历、职位、贡献数量或精通程度。

**User Stories / Acceptance Criteria**

| ID | User Story | Acceptance Criteria |
| --- | --- | --- |
| P01 | As a visitor, I want to see the portfolio immediately so that I understand the site without learning the desktop first. | 默认只自动打开一个作品集窗口；保留显式原生 App 深链接行为；关闭后可回桌面并重新打开 |
| P02 | As a visitor, I want to distinguish personal projects from contributions so that I understand the author's role. | 分类明确；具体贡献有证据才写；列表、详情和语言版本保持同一归属 |
| P03 | As a visitor, I want a stable project link so that I can revisit or share the work. | 直接打开、刷新、前进后退定位一致；未发布/下架返回明确不可用状态；不破坏既有项目路径 |
| P04 | As a visitor, I want clear source and trial links so that I can explore the project. | HTTPS 外链、新标签打开、链接性质明确；项目官网不冒充已经验证的在线 Demo；无官网时仅显示源码 |
| P05 | As a visitor, I want to explore existing apps so that this still feels like a useful OS. | 原有 App 注册与资源保留；新增应用不替换原应用；浏览器内文件操作与服务器内容管理隔离 |
| P06 | As the owner, I want to enter management from Settings without an account system. | 从开始菜单左侧栏→系统设置→站点维护进入；作品集不带设置按钮；不要求用户名，密钥不进前端包或 URL，API 独立验证会话 |
| P07 | As the owner, I want to revise drafts before publishing so that visitors never see unfinished edits. | 两种语言可分别编辑；草稿保存不改变公开快照；发布校验必填字段；已发布内容编辑后需再次发布 |
| P08 | As the owner, I want controlled media and ordering so that the portfolio stays curated. | 上传校验、私有/公开访问随发布状态变化；排序可预览并随发布生效；未用媒体与删除策略有记录 |
| P09 | As the owner, I want safe editing so that I do not silently lose changes. | 未保存状态可见；语言切换保留编辑；关闭/离开有提示；服务器版本变化返回冲突而非覆盖 |
| P10 | As a visitor, I want my language preference respected so that I can use the OS comfortably. | 手动偏好优先于浏览器；自动模式按支持语言匹配；缺词条有回退；内容双语字段独立于界面语言 |
| P11 | As a visitor, I want consistent OS behavior across devices so that the site retains the original daedalOS experience. | 全设备沿用原生响应式与窗口行为；没有自制底部导航、启动器、设备检测或模式覆盖；作品内容随窗口空间自然排列 |
| P12 | As a future maintainer, I want a reusable UI baseline so that later apps feel consistent. | 组件、颜色、间距、状态、表单、语言资源及键盘/触控规则形成可复用规范，而非仅一张首页图 |

**Non-Goals**

第一版不新增博客、衣柜、HealthOS、ContextOS、订阅看板等业务 App；这些议题保留需求池。也不交付面向他人的完整模板、不引入访客账户/社区投稿、不默认自动翻译文章、不承诺所有第三方原生 App 同步翻译或在所有手机上完整运行、不为上线强制新增 CDN 或双区域同时写数据库。

### 3. AI System Requirements (If Applicable)

作品集 v1 无必须运行的 AI 推理流程，不需要 LLM API、模型选择或智能推荐。通过资料整理产生的双语草稿应由作者维护，其来源记录与事实核验优先于生成效果。后续自动翻译若引入，应另立需求与质量评估，不在本阶段暗中扩展范围。

### 4. Technical Specifications

**Architecture Overview**

桌面外壳与原生应用沿用固定 SHA 的 daedalOS；个人业务放独立模块，通过集中注册和少数受记录的接入点连接。公开前端继续静态部署在 hyc.ac / GitHub Pages，内容与管理使用独立服务器 API；发布数据由数据库持久化，媒体使用受控对象存储。

本轮研究原型是实际 daedalOS 生产构建＋本地 Node 测试夹具，用来验证流程与接入，不直接代表生产后台。生产建议采用 TypeScript API、PostgreSQL、S3 兼容媒体存储；精确版本、部署供应商与密钥设置在计划/实施时锁定。

**Integration Points**

- 上游：`DustinBrett/daedalOS@f017b393d4175eb396a741a7562299423843f1b1`；跟进策略见 #10。
- GitHub 资料：仅作为初始公开内容来源，不在每次访客进入时依赖 GitHub API 实时可用。
- 路由：研究原型采用根页面 `?app=Portfolio&project=<id>`，与原有 `app/url` 入口兼容，不依赖 Pages 动态重写；更完整的静态分享预览由发布构建流程补齐。
- 会话：设置中单密钥换取 HttpOnly Cookie；公共与管理接口分离；写请求检查 Origin、CSRF 和版本。
- 数据：详细字段、状态机、接口与权限矩阵见 `data-and-permissions.md`。
- UI：一套与 daedalOS 一致的应用视觉；保留 Web App 与业务功能，字体/选中态/滚动条/工具栏优先复用上游。设计规范见 `design-system.md`，原生多设备行为见 `flows-and-states.md`。

**Security & Privacy**

密钥只在服务端校验，不存 localStorage、不嵌入静态包；生成/轮换时撤销旧会话。生产使用 HTTPS、限速、有期限会话、可撤销登录及最小管理操作面。管理入口不显眼不能作为授权机制。

双语正文按文本或受控 Markdown 输出，不允许任意脚本和 iframe；外链限制协议。媒体检验类型、体积与真实内容，草稿媒体不公开，发布快照仅含白名单字段。公开原生 App 文件系统不是作者的内容数据库。

保留原生终端/开发工具意味着同源客户端代码仍属于可信计算范围，不能声称“每个 App 已有独立安全沙箱”。生产方案需要检查原生代码执行、导入文件与外部嵌入路径；根据结果决定管理编辑器是否需要独立 origin 隔离。此项作为明确实施门禁，不由隐藏入口替代。

### 5. Risks & Roadmap

**Phased Rollout**

- 概念交付：本 PRD、内容与权限模型、流程、设计规范、架构决策、原型证据和计划任务。
- v1：一个精进的作品集 App＋必要系统增强，保留全部原生 App，桌面管理、三端浏览、中英双语、静态前端与独立内容服务。
- v1.1：根据使用反馈完善更多媒体形式、内容分享预览与地区网络表现；不自动承诺新增业务 App。
- v2：复用已经验证的设计规范开发后续 App，再评估独立模板/框架分发。

**Technical Risks**

| 风险 | 处理与验证 |
| --- | --- |
| 完整原生 App 与资源体积 | 保留功能，测量真实首屏请求与懒加载；不把仓库总大小当下载量，也不未经确认删除 App |
| 上游升级与本地接入 | 固定基线、维护补丁清单；集中注册与接入；以实际冲突和回归记录决定是否拆仓 |
| 小屏与上游行为差异 | 取消自制设备判断；对照固定上游窗口/任务栏行为测试，原生局限如实记录，改动须另立需求 |
| Pages 域名与既有项目 | 保留现有 DNS；路由清单与真实项目链接回归，新增 API 域名另做实施确认 |
| 单密钥与管理会话 | 强随机密钥、服务端保护、限速、撤销和轮换；客户端隐藏不计安全收益 |
| 公开内容准确性 | 区分个人项目与贡献；缺失资料不虚构；初始双语文案由作者在管理流程中复核 |
| 研究原型和生产能力混淆 | 每项验证标明环境与覆盖；文件存储、样图签名检查、同源模拟均不得直接宣称生产就绪 |

没有硬性上线日期；允许合理付费但本阶段不创建付费资源。质量由验收清单衡量，不能把“没有期限”变成无边界扩展。待负责人评审概念交付后，将 `implementation-plan.md` 的任务移交 #3。
