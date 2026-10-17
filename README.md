# Yincan Huang · Personal OS

基于 daedalOS 的个人站。正式前端源码直接位于此仓库；`research/` 是冻结研究归档，不参与产品构建。默认进入桌面，保留原生 App，增加作品集、应用商店及系统设置。

## 本地运行

使用 `.node-version` 指定的 Node 22.23.3 和 Yarn 1.22.22：

```sh
yarn install --frozen-lockfile --ignore-scripts
yarn build
yarn preview:local
```

访问 `http://127.0.0.1:4392`。开发内容服务自动创建独立的 `server/.runtime/`，不会读取或迁移原型数据。管理员开发密钥在该忽略目录的 `key.json` 中；不要提交或发到 Issue。该服务仅供本地联调，不是生产后端。

`yarn dev` 保留上游 Next 开发服务器能力；它本身不提供内容 API。完整同源体验使用上述构建＋本地服务命令。

## 结构与检查

- `components/`、`contexts/`、`pages/`、`utils/`、`public/`：保留上游布局，产品源码的唯一维护位置。
- `components/apps/Portfolio`、`AppStore`：自有业务和系统应用。
- `components/system/PersonalOS`、`personal-site.json`：站点配置、设置与接入。
- `server/`：本地开发 API 与合成数据测试；生产实现另行推进。
- `scripts/product/`：干净构建、站点资源检查、上游差异检查。
- `maintenance/upstream/`：固定基线、维护说明和升级演练证据。
- `specs/`、`research/`：规格及历史研究；不作为运行时依赖。

```sh
yarn lint
yarn test:unit
yarn test:server
yarn playwright install chromium
yarn e2e:product
yarn upstream:check
```

构建从当前仓库直接生成 `out/`，不会覆盖上游源码、下载移动分支或调用研究 overlay。CI 只检查，不部署；生产数据库、媒体、会话、多节点及域名发布仍待相应 Issue 验收。Messenger #20 保持暂缓。

## 上游与维护

来源：`DustinBrett/daedalOS`；采用的精确提交与运行版本见 [baseline.json](maintenance/upstream/baseline.json)。Git 历史保留上游和原项目两条 ancestry，远端 `origin` 为本站、`upstream` 为 daedalOS。新克隆如需升级，可添加 upstream remote；正常构建不需要它。

升级必须固定目标 SHA、创建独立 Issue/PR、检查产品差异、执行回归后再发布；禁止直接覆盖产品源码或自动同步到生产。流程见 [维护手册](maintenance/upstream/README.md)。

基于 Dustin Brett 的 daedalOS；原 MIT 许可证见 [LICENSE](LICENSE)，第三方来源见 [CREDITS](public/CREDITS.md)。
