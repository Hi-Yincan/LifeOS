# 内容读取与信息源管理边界

2026-10-18 · v2。用户已取消 LifeOS 管理员功能。本文替代此前 LifeOS 内单密钥会话、编辑、上传与发布的设计；历史研究只用于追溯。后续方案见 [信息源管理报告](../architecture/source-managed-content.md)。

## 统一展示

所有人在 LifeOS 中读取同一展示数据。LifeOS 不识别站长身份，不提供登录、登出、草稿读取、内容编辑或发布入口。语言、时区、筛选和窗口状态仍是每个浏览器的本机偏好，不改变内容授权。

站长在独立的信息源应用中鉴权并维护权威记录。该应用与 LifeOS 通过版本化数据契约连接，不共享管理员令牌、数据库口令或 OS 运行时。源系统生成可供所有人读取的展示数据；LifeOS 仅消费这一结果。

## 当前作品内容模型

| 对象 | 当前展示字段与规则 |
| --- | --- |
| Project | `id`、`kind`、`featured`、`order`、`technology`、`accent`、`repository`、`website`、`video`、`translations`、`imageUrl`；分类保留 project/tool/contribution/other；稳定 ID 和双语正文继续使用 |
| ProjectTranslation | `title`、`summary`、`background`、`contribution`、`detail`，按 zh/en 白名单输出；缺少证据的个人贡献不可编造 |
| Profile | `name`、`email`、`github`，以及双语 `headline`、`bio`、`education`；额外源字段不透传 |
| PublishedSnapshot | 当前本地运行文件中的 `published` 对象，或构建时明确 `published=true` 的种子内容；草稿变化不改变它 |
| Media | 仅允许已发布作品引用的合法媒体被读取；已有未发布文件保留在原目录，不因取消身份区分而公开 |

客户端 Project 类型已移除 `privateNote`、`published` 和编辑 `version`。源文件可以保留历史管理字段，但展示输出仍按白名单生成。所有人看到相同内容不改变既有资料的公开决定。

## 当前读取接口

| 路径 | 当前行为 |
| --- | --- |
| `GET /api/profile` | 本地只读公开资料 |
| `GET /api/projects` | 本地只读已发布作品列表 |
| `GET /api/projects/:id` | 本地只读已发布详情，未发布与不存在均不可用 |
| `/media/:id` | 只提供已发布作品引用的受支持媒体，不使用任何管理员 Cookie 放行 |
| `/api/session`、`/api/admin`、`/api/admin/*` | 本地服务所有方法返回 404，无会话 Cookie，无写入能力 |
| Pages `/content/*.json` | 构建导出的公开快照；LifeOS 请求映射到这些静态资源 |

前端共享 `request<T>(path)` 只发 GET，使用 `credentials: "omit"`。本地服务完全忽略旧身份信息；它不会生成或读取管理员密钥，不创建或修改运行目录。静态文件服务器没有写 API；测试环境对不支持的方法可能返回 501，这与本地服务的明确 404 分别验收。

## 信息源中的后续管理

创建、编辑、排序、上传、并发版本检查、发布和备份由独立源系统承担。本轮只评估可行性，没有建设这些能力。源端是否需要草稿和发布确认，按其业务确定；LifeOS 始终只有一个展示出口。

| 能力 | LifeOS 中的所有浏览者 | 独立源系统中的站长 |
| --- | --- | --- |
| 阅读 LifeOS 展示内容 | 相同内容与字段 | 返回 LifeOS 时也相同 |
| 编辑源记录、处理付款记录、发布 | 无入口、无写 API | 后续经源端认证与逐项授权实现 |
| 访问旧草稿、私有备注或管理凭据 | 不提供 | 由源系统自行控制，不进入 LifeOS |
| 原生编辑器、文件工具、游戏、商店本机清单 | 保留原有能力 | 同样保留，无额外站点特权 |

看板目前全部是明确标记的合成记录；没有连接真实健康、会员或服务器数据。全部样本直接显示，前端已删除角色、逐项可见性和隐私预览模型。真实来源接入时由来源确定统一展示数据，不在 LifeOS 恢复管理员分支。

## 验证与历史记录

本次验证见 [管理员功能移除验收](../development/validation/lifeos-admin-removal.md)。旧原型、旧单密钥实现报告及当时的验收留在历史记录中，不构成当前功能要求。已有运行数据与密钥文件没有删除或迁移；源码修改也不会自动替换已启动的旧进程或线上发布。
