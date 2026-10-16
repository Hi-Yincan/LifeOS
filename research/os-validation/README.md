# 展示型个人 OS：选型实验

2026-10-16，关联 Issue #1 的 R12 / [R13 实测报告](https://github.com/Hi-Yincan/Hi-Yincan.github.io/issues/1#issuecomment-6208862064)。这里是隔离的研究原型，不是已批准的生产实现。根目录站点未改动，全部内容为合成样例。

当前决议：[R15 / D-001](../closeout/decision.md) 已由项目负责人确认使用 daedalOS，产品调研已结束。本原型归档为展示/管理分层的可行性证据，不作为正式产品底座继续扩展；实验服务已停止，可按下文重新启动。[R14 成熟度复核](../framework-comparison/README.md) 保留当时的比较记录。

## 运行

在本目录执行（Node.js 22.12+）：

```sh
npm ci --ignore-scripts
npm run build
node tools/start-local.mjs
```

访问 `http://127.0.0.1:4387`。管理员入口在首页和应用内；实验口令自动生成，保存在本地忽略文件 `.runtime/credentials.json` 的 `adminPassword` 中。不要将该文件提交或发布。服务仅监听回环地址。

可同时用 `http://localhost:4387` 打开独立访客会话：两个主机名的 host-only Cookie 隔离。普通已登录 visitor 由 API 测试夹具验证；产品默认访客无需注册或登录。

```sh
npm test
# 保存可复核结果
node --test --test-reporter=tap test/*.test.mjs > evidence/backend-tests.tap
```

## 实验实现

- `@prozilla-os/core@2.1.2` + React 18.3.1；Vite 7.3.2；精确安装结果见 lockfile。
- 复用 Desktop、WindowsView、Taskbar、ModalsView，只注册博客和衣柜两个自定义 App，未修改上游源码。
- 博客只验证阅读。衣柜验证管理员创建、编辑、图片上传、发布、下架和访客只读。
- Node 内容服务是测试夹具：服务端角色校验、HttpOnly 会话、CSRF、独立草稿/发布快照、受控图片入口、本地文件持久化。不是完整 CMS 或生产身份服务。
- 公共图片撤回验证的是服务器后续访问返回 404，不能收回访客此前下载的文件。实验使用 no-store，没有验证 CDN 缓存清理。

## 结果与证据

验收定义见 `SPEC.md`。记录在 `evidence/`：

| 证据 | 范围 |
| --- | --- |
| `backend-tests.tap` | 11 项：权限越权、字段/图片隔离、内容发布快照、注销、重启持久化、非法输入和依赖边界 |
| `browser-lifecycle.json` | 实际 UI 创建草稿、上传、发布、修改、下架、注销；独立访客会话读取 |
| `browser-navigation.json` | 深链接、刷新、前进后退、窗口最大化/最小化恢复/关闭 |
| `browser-mobile.json` | 390×844 仿真，管理员保存、注销、返回、阅读和横向溢出测量 |
| `build-assets.json` | 构建产物逐文件原始体积及独立 gzip 估计，不是网络测速 |
| `browser-resources.json` | 单次页面 Resource Timing 观测，受本地缓存影响 |
| `puter-tests.json` | 本地 Puter 的 19 项上游定点测试结果与源码版本 |

浏览器流程的复现顺序：访客读蓝色衬衫 → 管理员新建衣物并保存 → 上传 `evidence/upload-fixture.png` → 在另一主机名验证草稿详情和图片 404 → 发布 → 验证公开详情/图片 200 且无私有备注 → 修改但不重新发布，访客仍见旧版 → 下架，访客详情和图片 404 → 注销，管理接口 401。移动端在开发者工具中设为 390×844，再登录、编辑草稿、保存并返回阅读。

## 集成中实际发现的问题

1. core 2.1.2 默认 Desktop 预设会引用 Documents/Pictures；关闭这些目录但保留默认 Desktop 时，初始化发生 `undefined.split` 错误。现用公开 `virtualDrive.defaultData.loadData` 接口创建最小 Desktop 与配置，关闭默认文件夹预设；未 patch node_modules。
2. 实验表单在刷新列表时曾显示旧值；改为从当前列表派生选中项，并按内容更新时间重建编辑表单。已在真实保存流程复核。
3. 窗口与 URL 需要业务适配。重复点击相同链接须显式恢复最小化窗口；窗口管理器不是 React 窗口列表订阅接口，关闭后的 URL 更新改由 App 生命周期处理。高级多窗口焦点、所有历史组合不在本次覆盖内。
4. 核心包仍包含虚拟磁盘和命令模块，构建会输出多个命令 chunk。未安装可选终端/文件管理 App 不等于去除了对应基础设施。
5. Vite 有主 chunk 超过 500 kB 和部分未用皮肤字体路径的构建警告。没有据此声称已实现轻量化或 SEO。

## Puter 对照验证

本地仓库 HEAD：`f9860b036bc34b540e5ffc16fc230671c069141d`。运行中的实例是 Node 服务，不是 Docker。仅走查现状、阅读源码、运行使用 mock / 内存存储的上游测试；没有改其配置、部署扩展或创建完整衣柜 App，也没有修改用户已有工作区变更。

执行命令（在 Puter 仓库）：

```sh
node node_modules/vitest/vitest.mjs run \
  src/backend/services/apps/RecommendedAppsService.test.ts \
  src/backend/controllers/homepage/HomepageController.test.ts \
  --config src/backend/vitest.config.ts --no-file-parallelism --maxWorkers=1
```

`doc/architecture.md` 与 `RecommendedAppsService.ts` 确认 `app.recommended` 扩展可以替换推荐列表，包含空列表。`PuterHomepageService.ts` 有 GUI 参数/脚本注入扩展点。不能将“Puter 功能多”写成“必须改核心才能隐藏应用”。不过，推荐入口定制不等于依赖裁剪，也不等于本项目的内容级 visitor/admin 授权；本次没有验证 Puter 中完整的公开只读展示模式。禁止注册会要求现有账户登录，不能直接替代公开访客体验。

## 结论与未完成项

已证明“OS 外壳＋独立内容服务”能够形成阅读和管理闭环，值得作为首选架构方向。ProzillaOS 只是获得了实测依据的候选，尚未冻结选型；Puter 保留用于确实需要云文件、通用用户工作空间等能力时的条件方案。

未完成：生产认证/CMS 选型、SEO 与分享预览、可访问性、真机触控、完整视觉验收、真实内容迁移、备份恢复、部署、负载与全面安全审计。截图 API 多次超时，没有截图证据；使用语义快照、DOM 测量和真实交互核验。移动端工具自动滚动曾超时，通过 DOM 滚动定位后真实点击继续；不能据此声称真机滚动已验收。Puter 与原型的验证深度不同，没有横向性能排名。
