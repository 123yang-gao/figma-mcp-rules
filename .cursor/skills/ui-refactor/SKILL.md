---
name: ui-refactor
description: >-
  sweepstakes-shell UI 重構工作流：在保留既有功能的前提下替換頁面 UI（含 Figma
  MCP 設計稿接入）。當用戶說「重構 UI」、「換新設計」、「Figma 實作」、「ui-refactor」、
  「按設計稿改頁面」、「Container/Presenter 拆分」時必須使用。涵蓋綁定清單、重構步驟、
  RWD 規則、驗證 checklist。
---

# UI Refactor（sweepstakes-shell）

在**不破坏路由契约与业务逻辑**的前提下，替换页面 UI。设计稿接入优先读 `docs/figma-naming-guide.md`。

## 铁律（违反即回滚）

| 禁止 | 原因 |
|------|------|
| 改路由 URL（`/buy` 等） | 全站 `PlusModalLink` 硬编码 |
| 改 `app.vue` 的 `PlusModalPage name` | 模态群組名绑定 |
| 删 stub 页 `definePageMeta`（middleware/permission） | 门禁用 |
| Presenter 内直接调 store / API | 逻辑应在 Container / composable |
| `router.push` 开模态页 | 必须用 `PlusModalLink` / `useModalRouter` |
| 硬写用户可见文字 | 必须 `$t('key')`，新 key 走 `pnpm i18n` |
| 使用 `any` | 项目 TypeScript 规范 |

## 架构分层

```
路由契约（stub definePageMeta）     ← 不动
    ↓
Container（pages/@xxx/*.vue）       ← 编排：composable + 导航
    ↓
Presenter（components 新 UI）       ← 只接 props / emit
    ↓
Composable + Store + API            ← 复用，不重写
```

## 工作流程

### Phase 0：确认范围

用户应指明：**哪个页面** + **Figma 链接（如有）** + **web / mob / 两者**。

查绑定清单：读 [bindings.md](bindings.md) 对应章节。

### Phase 1：读设计（有 Figma 时）

1. 从 URL 提取 `fileKey`、`nodeId`（`-` 转 `:`）
2. `get_metadata` → 核对图层名是否符合 `docs/figma-naming-guide.md`
3. `get_design_context` + `get_screenshot`（节点过大则拆子节点）
4. 有 Code Connect 则优先用映射组件
5. 命名对不上时，按截图 + 标注推断，并在回報時列出假设

### Phase 2：抽 Composable（逻辑搬迁）

从旧 `@xxx/` 页或大型组件的 `<script>` 抽到 `app/composables/use{Page}Flow.ts`：

- `onMounted` / `onActivated` 生命周期
- store 读取与 action 调用
- `useModalRouter` 跳转
- KYC / 权限 / pixel 副作用

**不改行为**，纯搬迁。若无现成 composable，新建；已有则扩展。

### Phase 3：写 Presenter（纯 UI）

新组件放 `app/components/{Domain}/`，例如 `NewPackageGrid.vue`：

- 只接收 props、emit 事件
- 样式用项目 SCSS + CSS 变量（`app/assets/css/_vars.scss`）
- RWD 见下方「RWD 规则」

### Phase 4：接 Container

在 `pages/@xxx/` 组合：

```vue
<script setup lang="ts">
const flow = useBuyFlow()
</script>
<template>
  <BuyModal :page-title="$t('...')">
    <NewPackageGrid v-bind="flow.packageProps" @select="flow.onSelectPackage" />
  </BuyModal>
</template>
```

- **保留**原 Modal Shell（`BuyModal`、`BaseModal`、`MemberModal`）的关闭追踪、`safeClose`
- stub 页 `pages/buy.vue` 等**不动**

### Phase 5：验证

必须全部通过才能宣告完成：

```bash
pnpm lint
pnpm type-check
```

并逐项执行下方 **Verification Checklist**。

---

## RWD 规则（本项目特有）

**不是纯 CSS 自适应**，是「设备判断 + 样式分叉」：

```ts
const { isMobile } = useDevice()
// 或 isWeb() from ~/utils/navigatorUtils
```

| 手段 | 用法 |
|------|------|
| `:class="{ 'is-web': !isMobile }"` | 桌面覆盖样式 |
| `v-if="isMobile"` / `v-if="!isMobile"` | 显隐不同区块 |
| 不同图片 | `isMobile ? mImg : wImg`；Banner 用 `m_` / `w_` groupName |
| `.is-web` 内 `@media` | 375 / 768 / 1366 / 1920 列数渐变 |
| `clamp()` | 弹窗宽度 |
| `Px` + prettier-ignore | 不转 rem |

Figma 有 `web` + `mob_375` 两套稿时，**两套都要实现**。

---

## 导航绑定

| 场景 | 用法 |
|------|------|
| 入口链接 | `<PlusModalLink prefetch to="/buy">` |
| 模态内下一步 | `useModalRouter().push('/orderSummary')` |
| 关闭模态 | `useSmartNavigation().safeClose()` |
| 返回 | `goBack()` 或 `modalRouter` 视上下文 |

---

## 模块化绑定速查

完整字段见 [bindings.md](bindings.md)。重构前必须打开对应章节。

| 模块 | Container 路径 | Composable | 关键 Store |
|------|---------------|------------|-----------|
| 首页 | `pages/index.vue` | — | session, game, promotion |
| 登录 | `pages/@auth/login.vue` | — | session + useGeetest + useRadarFraud |
| 注册 | `pages/@auth/register.vue` | useRegisterState | session, useRegInfo |
| 购买 | `pages/@buy/buy.vue` | useBuyFlow（待抽） | account, promotion + useIdentify |
| 订单/付款 | `pages/@buy/orderSummary.vue` 等 | usePayment, usePaysafe | account |
| 提现 | `pages/@redeem/redeem.vue` | useWithdraw | account + useRadarFraud |
| 游戏列表 | `pages/games/[gameCategory].vue` | useGame | game |
| 游戏内 | `pages/play.vue` | useGame | game, account + Wake Lock |
| 个人中心 | `pages/@member/profile.vue` | — | member, account, usePermissions |
| 搜索 | `pages/@search/search.vue` | useGame | game |
| 邀请 | `pages/@invite/invite.vue` | useInvite | promotion |
| 活动 | `pages/promotions.vue` | — | common, promotion |
| 代理 | `pages/agent*.vue` | useAgent | member（isAgent） |

---

## Verification Checklist

每个页面重构完成后逐项勾选：

### 路由与权限

- [ ] stub 页 `definePageMeta` 未改动（middleware、permission、layout）
- [ ] URL 与 `PlusModalLink to` 路径一致
- [ ] 未登录访问需 auth 页 → 跳转 login 模态
- [ ] `permission` 页（buy/redeem）无权限时 redirect `/`

### UI 与 RWD

- [ ] mob（375）布局与 Figma 一致
- [ ] web（1366/1920）`.is-web` 分支已实现
- [ ] 无硬编码用户可见文字（全 `$t`）
- [ ] 图片资源 mob/web 正确分流（如适用）

### 功能绑定

- [ ] 数据来自正确 store / API（非写死）
- [ ] 按钮跳转路径与 bindings.md 一致
- [ ] KYC 拦截点仍触发（login/deposit/withdraw/game）
- [ ] 登录/登出后状态正确（`useAuthLifecycle` 无需改但行为要测）
- [ ] 关闭弹窗 / pixel track / `safeClose` 正常

### 代码质量

- [ ] `pnpm lint` 0 errors
- [ ] `pnpm type-check` 通过
- [ ] 无 `any`；store 手动 import
- [ ] Presenter 无 store 直接调用

### 手动冒烟（按页面选测）

- [ ] 首页：guest / member 切换显示正确
- [ ] buy：选包 → orderSummary → paymentConfirm → paymentInvoice
- [ ] redeem：金额 → 确认 → 成功 / 绑卡子流程
- [ ] login/register：Geetest、登录后余额刷新
- [ ] play：游戏启动、返回、钱包切换

---

## Figma 图层 → 代码映射模板

设计稿节点与代码对不上时，在 PR / 回報中填写：

```markdown
| Figma 图层 | Vue 组件 | 绑定 |
|-----------|----------|------|
| page/buy_member_mob_375 | @buy/buy.vue | useBuyFlow |
| list/package_grid | NewPackageGrid.vue | accountStore.coinPackagesList |
| btn/close | BuyModal | safeClose() |
```

---

## 推荐交付顺序

按依赖与风险分批，不要一次全改：

1. `home` → 2. `auth`（login/register）→ 3. `buy` 流程 → 4. `redeem` → 5. `profile/member` → 6. 活动页 → 7. `agent`

每批：独立分支 → 验收 checklist → 再下一批。

## 相关文档

- 功能全景：`docs/project-features.md`
- 设计师命名：`docs/figma-naming-guide.md`
- 页面绑定详情：[bindings.md](bindings.md)
