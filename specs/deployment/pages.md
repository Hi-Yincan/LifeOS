# 首次 Pages 访客版发布

2026-10-17 · 实施 #23，架构 #12。负责人授权新的 OS 上线。本次以访客版完成上线，生产管理服务仍为后续工作；不是完整管理员生产能力验收。

## 发布范围

- 默认桌面、全部原生进程、作品集、App Store、系统设置及中英语言保留。
- 作品集由构建期公共字段白名单生成静态 JSON，只选 published=true；排除草稿、私有备注、版本和本地运行数据。
- 设置中的在线内容管理显示暂未开放；不会展示无后端可用的密码表单，也不会请求 /api/session。本地默认构建仍保留完整管理流程。
- 内容来自仓库中已提交的 server/content/seed.json；修改后走源码 PR 和新发布。server/.runtime 和原型运行目录绝不参与构建。
- 有本地 imageId 的作品必须先明确发布媒体，构建拒绝静默导出失效或私有图片链接。

## 构建与发布

GitHub Pages 使用 Actions 发布模式，自定义域名继续为 hyc.ac，DNS 不变。

1. 源码进入 main，Product checks 通过。
2. 手动运行 Publish visitor OS（pages.yml）；仅接受 main，不自动发布普通 push 或 PR。
3. 锁定 Node/Yarn 安装，lint、单元和服务测试通过后执行 `node scripts/product/build.mjs --public`。
4. 对真实静态文件服务器执行浏览器验收（需要 Python 3）：

```sh
PUBLIC_DEPLOYMENT=1 yarn playwright test --config=playwright.public.config.ts
```

5. upload-pages-artifact 明确 include-hidden-files: true，保留必要的 .index；仅上传 out，不上传整个仓库。构建检查必需索引、公开快照、无 runtime/API/private 目录、无符号链接和小于 1 GiB。
6. deploy-pages 使用短期 GitHub OIDC 权限部署同一份已验证产物。release.json 记录源码完整 SHA、模式、构建时间和体积。
7. 核验线上 release.json、首页/头像、作品详情、商店、设置、原生 App、.index 和现有项目路径；具体结果写 Issue 评论。

发布产物保留 30 天；本次之前的首页固定在 pages-live，不能用于继续开发产品。

## 回退

初次上线发生问题，可恢复此前页面：

```sh
gh api --method PUT repos/Hi-Yincan/Hi-Yincan.github.io/pages \
  -f build_type=legacy -f 'source[branch]=pages-live' -f 'source[path]=/'
```

pages-live 当前固定为 f40bf4060ae081e6ed9f16ce556a83967ef922f1，包含原首页与 hyc.ac 的 CNAME。恢复后检查 Pages 构建及线上内容，不改 DNS。后续 OS 版本回退应对源码做明确 revert，测试后手动发布；不靠强推覆盖 main。

## 本次不覆盖

Pages 不执行内容服务，尚无线上管理、数据库事务、多节点、私有媒体或会话能力。构建器中的 Next headers 对静态导出不生效，Pages 没有本项目配置的 COOP/COEP 响应头；需要跨源隔离/SharedArrayBuffer 的重型原生功能，以及依赖外部服务、跨域许可或账户的功能，不承诺完整可用。保留全部 App 不等于验证了它们全部功能。

手机/iPad 沿用上游布局；本次不另建移动皮肤。国内外真实网络及真机覆盖仍在 #12/#14 后续验收中。
