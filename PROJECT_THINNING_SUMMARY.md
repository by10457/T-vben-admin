# Project Thinning Summary

本文记录本仓库基于 Vben 官方「应用精简」文档完成的一轮项目精简结果。

参考文档：

- https://doc.vben.pro/guide/introduction/thin.html

执行时间：2026-04-30

## 精简目标

将原始 Vben Admin monorepo 收敛为以 `web-antdv-next` 为主应用的模板项目，同时保留本地开发所需的 mock 服务和用户明确要求暂时保留的 `playground`。

本轮精简只处理应用、文档站、workspace 配置和基础验证，不继续深入删除 `web-antdv-next` 内部的演示路由、登录附属页或业务示例页面。

## 保留内容

当前明确保留：

- `apps/web-antdv-next`
- `apps/backend-mock`
- `playground`
- `internal/*`
- `packages/*`
- `scripts/*`

保留 `apps/backend-mock` 的原因：

- `apps/web-antdv-next/.env.development` 当前配置 `VITE_NITRO_MOCK=true`
- 前端开发接口使用 `/api`
- `apps/web-antdv-next/vite.config.ts` 将 `/api` 代理到 `http://localhost:5320/api`
- 登录、用户信息、权限码、菜单接口仍依赖 mock 服务

如果后续接入真实后端，再考虑删除 mock 服务会更稳。

## 删除内容

本轮删除了其他 UI 版本应用：

- `apps/web-antd`
- `apps/web-ele`
- `apps/web-naive`
- `apps/web-tdesign`

本轮删除了文档站：

- `docs`

本轮曾短暂删除 `playground`，随后按要求恢复。因此最终状态是：`playground` 保留。

## 配置调整

### package.json

根目录 `package.json` 已删除失效脚本：

- `build:antd`
- `build:docs`
- `build:ele`
- `build:naive`
- `build:tdesign`
- `dev:antd`
- `dev:docs`
- `dev:ele`
- `dev:naive`
- `dev:tdesign`

仍保留与当前项目结构匹配的脚本：

- `dev:antdv-next`
- `build:play`
- `dev:play`
- `build`
- `dev`
- `preview`

### pnpm-workspace.yaml

已移除不存在的 `docs` workspace 声明。

仍保留：

```yaml
packages:
  - internal/*
  - internal/lint-configs/*
  - packages/*
  - packages/@core/base/*
  - packages/@core/ui-kit/*
  - packages/@core/forward/*
  - packages/@core/*
  - packages/effects/*
  - packages/business/*
  - apps/*
  - scripts/*
  - playground
```

其中 `apps/*` 当前只匹配：

- `apps/backend-mock`
- `apps/web-antdv-next`

### pnpm-lock.yaml

执行 `pnpm install` 后已同步 lockfile。

确认 `pnpm-lock.yaml` 不再包含这些已删除 workspace importer：

- `apps/web-antd`
- `apps/web-ele`
- `apps/web-naive`
- `apps/web-tdesign`
- `docs`

## 验证记录

已执行并通过：

```bash
pnpm install
pnpm -F @vben/web-antdv-next run typecheck
pnpm -F @vben/web-antdv-next run build
```

`pnpm install` 结果：

- 成功完成
- workspace 范围识别为 41 个项目
- 移除了 131 个不再需要的包
- `postinstall` 和 `lefthook install` 正常执行

`typecheck` 结果：

- `@vben/web-antdv-next` 类型检查通过
- 未产生额外未跟踪文件

`build` 结果：

- `@vben/web-antdv-next` 生产构建通过
- 生成 `apps/web-antdv-next/dist`
- 生成 `apps/web-antdv-next/dist.zip`
- 两个构建产物均被 `.gitignore` 忽略，不进入提交范围

构建产物大小：

```text
apps/web-antdv-next/dist      4.4M
apps/web-antdv-next/dist.zip  1.2M
```

## 已知提醒

`pnpm install` 中出现 peer dependency warning，主要是部分 Vite 插件的 peer range 尚未覆盖当前项目使用的 `vite@8.0.8`。安装最终成功，这不是本次精简引入的阻断问题。

`web-antdv-next` 构建中出现两个 tolerated BigInt transform warning，来源于依赖 `@v-c/mini-decimal`。构建最终成功，这不是本次精简引入的阻断问题。

## 未继续执行的精简项

本轮最后做了只读分析，但未继续删除以下内容：

- `apps/web-antdv-next/src/router/routes/modules/demos.ts`
- `apps/web-antdv-next/src/views/demos`
- `apps/web-antdv-next/src/router/routes/modules/vben.ts` 中的官方外链和 About 路由
- `apps/web-antdv-next/src/views/_core/about`
- `apps/web-antdv-next/src/views/_core/authentication` 中的验证码登录、二维码登录、忘记密码、注册页面
- `apps/web-antdv-next/src/views/dashboard/workspace/index.vue` 中指向 `/demos/...` 的快捷入口
- `apps/backend-mock/utils/mock-data.ts` 中 backend 权限模式下的 demos 菜单

这些内容如果后续继续精简，建议分批处理，并在每批之后运行：

```bash
pnpm -F @vben/web-antdv-next run typecheck
pnpm -F @vben/web-antdv-next run build
```

## 当前最终状态

当前项目已完成基础精简：

- 主应用：`apps/web-antdv-next`
- 本地 mock：`apps/backend-mock`
- 演示 playground：保留
- 官方 docs：已删除
- 其他 UI 应用：已删除
- 根脚本：已清理
- workspace：已同步
- lockfile：已同步
- 主应用类型检查：通过
- 主应用生产构建：通过
