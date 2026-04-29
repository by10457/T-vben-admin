# T-vben-admin 二次开发清理检查

检查时间：2026-04-30

## 结论

当前项目是从 `vue-vben-admin` 复制出的完整 monorepo 模板。对于二次开发，真正值得清理的不是零散小文件，而是这些上游模板/发布/演示资产：

- 上游发布链路：`.changeset`、changeset 脚本和依赖。
- 上游仓库元信息：`package.json` 和各子包 `package.json` 里的 `homepage`、`bugs`、`repository`、`author`。
- 只用于在线开发或上游流程的配置：`.gitpod.yml`。
- 只在你使用 Docker 镜像交付时才需要的部署脚本：`.dockerignore`、`scripts/deploy`、`build:docker`。
- 只在保留 playground e2e 测试时才需要的 Playwright 配置和依赖。
- 多 UI 框架应用目录：`apps/web-antd`、`apps/web-antdv-next`、`apps/web-ele`、`apps/web-naive`、`apps/web-tdesign`，应按最终选型只保留一个或少数几个。
- 文档站和演示项目：`docs`、`playground`，如果只是业务后台开发，通常可以删除或暂时移出仓库。
- 复制来的 `node_modules` 体积约 2.0G，不应提交到 Git；是否本地删除取决于你是否愿意重新 `pnpm install`。

## 重要发现

### 1. `.git` 现在是新仓库，不是上游历史

检查结果：

```text
## No commits yet on master
```

`git remote -v` 没有输出，`.git/config` 也没有远程仓库配置。因此它不是误带的 `vue-vben-admin` Git 历史，而是一个未提交的新仓库。可以保留，后续直接做第一次提交。

### 2. `.changeset` 不服务于上游同步

`.changeset` 是 changesets 发布版本工具的配置，不是用来局部升级上游项目。当前关联点：

```json
"changeset": "pnpm exec changeset",
"version": "pnpm exec changeset version && pnpm install --no-frozen-lockfile",
"@changesets/changelog-github": "catalog:",
"@changesets/cli": "catalog:"
```

如果你的项目不会发布 workspace 包到 npm，建议清理 `.changeset`，同时清理关联脚本和依赖。

### 3. 上游身份信息残留很多

根 `package.json` 仍是：

```json
"name": "vben-admin-monorepo",
"homepage": "https://github.com/vbenjs/vue-vben-admin",
"bugs": "https://github.com/vbenjs/vue-vben-admin/issues",
"repository": "vbenjs/vue-vben-admin.git"
```

各 apps、packages、internal 子包也大量保留 `github.com/vbenjs/vue-vben-admin`、`vben.pro`、`ann.vben@gmail.com` 等信息。二次开发项目建议至少先改根 `package.json`，子包信息可以第二阶段再统一处理。

### 4. 环境变量里有模板值和上游 mock 地址

所有前端应用 `.env.production` 默认指向：

```text
VITE_GLOB_API_URL=https://mock-napi.vben.pro/api
```

所有应用 `.env` 默认包含：

```text
VITE_APP_STORE_SECURE_KEY=please-replace-me-with-your-own-key
```

如果准备作为自己的业务项目，这两个都应该尽早替换。尤其生产 API 地址不能保留上游 mock 服务。

### 5. 多应用入口是最大的清理点

当前 `apps` 下有：

```text
apps/backend-mock
apps/web-antd
apps/web-antdv-next
apps/web-ele
apps/web-naive
apps/web-tdesign
```

其中 `web-antd` 和 `web-tdesign` 体积约 39M，其他 UI app 只有几百 KB。体积差异通常来自示例资源或构建缓存/依赖链接，不代表功能价值。

如果你已经确定 UI 技术栈，建议只保留目标 app。例如选 Ant Design Vue，则优先保留 `apps/web-antd` 和公共 `packages`/`internal`，清理其他 UI app。

### 6. `docs` 和 `playground` 是演示/文档资产

`docs` 是 VitePress 文档站，根脚本里有：

```json
"build:docs": "pnpm run build --filter=@vben/docs",
"dev:docs": "pnpm -F @vben/docs run dev"
```

`playground` 是演示应用，并带 Playwright e2e：

```json
"dev:play": "pnpm -F @vben/playground run dev",
"build:play": "pnpm run build --filter=@vben/playground",
"test:e2e": "turbo run test:e2e"
```

如果目标是业务后台项目，通常可以清理二者。保守做法是先保留 `playground` 一段时间当组件参考，等主应用迁移稳定后再删除。

## 建议清理分级

### 第一阶段：低风险清理

这些基本不影响业务开发：

- `.gitpod.yml`
- `.changeset`
- 根 `package.json` 中的 `changeset` 脚本
- 根 `package.json` 中的 `version` 脚本，或改成你自己的版本策略
- 根 `package.json` 中的 `@changesets/changelog-github`
- 根 `package.json` 中的 `@changesets/cli`
- `check:cspell` 里的 `".changeset/*.md"`
- 根 `package.json` 的 `homepage`、`bugs`、`repository`、`author`、`keywords`
- README 多语言文件中不准备维护的版本，例如 `README.ja-JP.md`

### 第二阶段：按项目选型清理

这些需要先决定保留哪个应用入口：

- 未选用的 UI app：
  - `apps/web-antd`
  - `apps/web-antdv-next`
  - `apps/web-ele`
  - `apps/web-naive`
  - `apps/web-tdesign`
- 根脚本中对应的 `dev:*`、`build:*`
- `.vscode/launch.json` 中对应调试配置
- `pnpm-workspace.yaml` 中是否继续保留所有 `apps/*`

### 第三阶段：看交付方式清理

这些不一定需要：

- `.dockerignore`
- `scripts/deploy`
- 根 `package.json` 的 `build:docker`
- `playground/playwright.config.ts`
- `playground/__tests__/e2e`
- 根 `package.json` 的 `test:e2e`
- `playwright`、`@playwright/test` 相关依赖

如果你未来有自己的 Docker 部署方式，建议不是直接保留上游 `scripts/deploy`，而是后续按自己的应用名、端口、构建目标重新写。

## 建议保留

这些对二次开发仍然有价值：

- `.editorconfig`
- `.gitignore`
- `.gitattributes`
- `.gitconfig`
- `.node-version`
- `.npmrc`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`
- `eslint.config.mjs`
- `oxfmt.config.ts`
- `oxlint.config.ts`
- `stylelint.config.mjs`
- `cspell.json`
- `lefthook.yml`
- `internal`
- `packages`
- `apps/backend-mock`，至少在真实后端接入前可以保留

## 推荐执行路线

1. 先确定主应用 UI：Ant Design Vue、Element Plus、Naive UI、TDesign、Antdv Next 选哪个。
2. 先改品牌和仓库元信息：根 `package.json`、README、应用 `.env` 标题和 namespace。
3. 清理 `.changeset` 和上游发布链路。
4. 替换所有生产环境 API 地址和 store secure key。
5. 等主应用能正常 `dev` 和 `build` 后，再删除未选中的 app、docs、playground。
6. 最后执行 `pnpm install` 更新 lockfile，并跑一遍 `pnpm lint`、目标应用 `pnpm build:*`。

## 删除注意

当前会话有明确限制：禁止批量删除文件或目录，也不能使用递归删除命令。如果要删除目录，建议由你手动删除，或者先让我改配置文件和脚本，目录清理你在资源管理器里做。
