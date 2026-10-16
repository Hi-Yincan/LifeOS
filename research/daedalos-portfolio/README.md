# daedalOS 个人作品集研究原型

这是概念验证，不是生产实现。源码 overlay 与内容服务在本目录；完整 daedalOS 在独立临时 checkout 构建，根目录现有站点未修改。

- 本地入口：`http://127.0.0.1:4391`
- 基线：`DustinBrett/daedalOS@f017b393d4175eb396a741a7562299423843f1b1`
- 默认自动打开作品集；系统设置可切换中文/英文、两套布局、深浅色、自动/桌面/平板/手机模式。
- 管理入口：设置 → 站点维护。密钥在本机忽略目录 `.runtime/key.json` 中；不要提交、截图或粘贴到 Issue。无用户名。
- 公开四个项目；浏览器验证创建的合成项目保持下架，仅管理态可见。

## 复现

需 Git、Node 与 Yarn Classic。此次实际环境为 Node 26.7.0、Yarn 1.22.22；上游 CI 的 Node 22 尚未在本轮本机重复测试。正式项目应先锁定并验证统一版本。

```sh
git clone https://github.com/DustinBrett/daedalOS.git /tmp/hi-yincan-daedalos-concept
git -C /tmp/hi-yincan-daedalos-concept checkout f017b393d4175eb396a741a7562299423843f1b1
cd /tmp/hi-yincan-daedalos-concept
yarn install --frozen-lockfile --ignore-scripts
```

回到本仓库根目录执行：

```sh
node research/daedalos-portfolio/tools/prepare.mjs /tmp/hi-yincan-daedalos-concept
```

在上游 checkout 中运行 `yarn build`，然后回本仓库运行：

```sh
node research/daedalos-portfolio/tools/start.mjs /tmp/hi-yincan-daedalos-concept/out
node --test research/daedalos-portfolio/test/*.test.mjs
```

没有全局 Yarn 时，可用 `npm exec --yes --package=yarn@1.22.22 -- yarn <参数>` 执行对应命令。锁文件来自固定上游提交，不随研究原型修改。

`prepare.mjs` 检查 SHA，复制自有 overlay，并修改 6 个明确列出的上游文件；识别不了的已有改动会拒绝覆盖。这是实验构建工具，**不等于生产 submodule 接入契约**。应用保留和补丁清单见 `evidence/integration-manifest.json`。

## 验证与限制

参见 [完整报告](../concept/validation.md) 与 [概念目录](../../specs/concept/README.md)。本地服务仅绑定 127.0.0.1，浏览器访客隔离测试使用 localhost 主机名；这不代表真实跨域部署已完成。

本地 JSON 存储、内存会话、图片签名检查是测试夹具。生产需要数据库、对象存储、实际图片解码、跨域/HTTPS Cookie、密钥轮换、审计与多节点验证。原型没有资料编辑器、完整媒体画廊、所有公共 OS 菜单翻译、每个作品独立 SEO 元数据。

本地服务提供 COOP/COEP 响应头；静态导出时 Next headers 不生效。不能据此认定 GitHub Pages 上所有重型 App 可用。完整 33 项应用/进程条目保留，但本轮只对代表应用做启动检查。

`browser-evidence.mjs` 使用上游已有的 html-to-image 生成 **DOM 渲染图**；不是原生屏幕截图，也不替代真机测试。研究辅助脚本不作为生产依赖或公开产品功能。

运行状态、会话、口令、上传测试数据、依赖与完整上游 checkout 均不归档。服务停止后，可按上面命令重新启动；会话失效、内容保留。请勿把本地夹具直接暴露到公网。
