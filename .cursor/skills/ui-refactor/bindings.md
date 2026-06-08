# UI Refactor 页面绑定清单

> 重构时按页面查阅。Presenter 只展示数据；Container / composable 负责下列绑定。

---

## 全局（所有页面）

| 绑定 | 来源 |
|------|------|
| 登录态 | `useSessionStore().isLoggedIn` |
| 登入后生命周期 | `useAuthLifecycle()`（app.vue 已挂载，勿重复） |
| 维护/地区限制 | `commonStore.maintenance` / `regionRestriction` |
| 侧栏 | `uiStore` + `SideMenu.vue` |
| 票券浮标 | `TicketEntry`（`app.vue`，登录后） |
| KYC 弹窗 | `KycPopup`（`app.vue`） |
| 多语言 | `$t('key')` |
| 客服 | `useCs().openCs()` |

---

## home — `pages/index.vue`

| Figma / 区块 | 组件 | 数据 / 行为 |
|-------------|------|------------|
| `sec/header` | `HomeHeader` | session, account 余额 |
| `sec/banner` | `HomeBanner` | `commonStore.banners` |
| `sec/game_nav` | `HomeGameMenu` | 仅 member；切换分类 |
| `list/game_new` 等 | `GameSlideWrap` | `gameStore`；category: new/top/hot/rng/ac/tg |
| `sec/vendor` | `HomeGameVendor` | 厂商入口 |
| `sec/coin_packages` | `HomeCoinPackages` | 仅 member；`accountStore` |
| `sec/winner` | `Winner` | 排行榜 API |
| `sec/enjoy_more` | `HomeEnjoyMore` | 仅 guest |
| `sec/players_comment` | `HomePlayersComment` | 仅 web（`!isMobile`） |
| `sec/footer` | `HomeFooter` | — |
| `sec/bottom_footer` | `HomeBottomFooter` | 仅 mob + member |

**RWD：** `:class="{ 'is-web': !isMobile }"`；支付/联系图 mob/web 两套。

---

## auth — login / register / forgot

### login — `pages/@auth/login.vue`

| 绑定 | 来源 |
|------|------|
| 表单 | `FormLoginItem` / `WithLoginItem` |
| 提交 | `sessionStore.normalLogin()` / `firebaseLogin()` |
| 人機驗證 | `useGeetest()` |
| 欺詐 | `useRadarFraud().withRadarFraud('login')` |
| 跳转注册 | `PlusModalLink to="/register"` |

### register — `pages/@auth/register.vue`

| 绑定 | 来源 |
|------|------|
| 状态机 | `useRegisterState()` |
| Email 注册 | `sessionStore.registerEmail()` |
| 手机注册 | `sessionStore.registerOnlyMobile()` |
| 归因 | `useRegInfo()` / `getPixelTrack()` |
| 欺詐 | `withRadarFraud('register')` |

### forgot — `pages/@auth/forgot.vue`

| 绑定 | 来源 |
|------|------|
| 表单 | `ForgotItem` |
| OTP | `useSms` / `useEmail` |

**stub meta：** 无 auth middleware（公开）。

---

## buy 流程

### buy — `pages/@buy/buy.vue`

| 绑定 | 来源 |
|------|------|
| middleware | `auth` + `permission: allowDeposit` |
| 套餐列表 | `accountStore.getCoinMallPackage()` |
| Extra Reward | `promotionStore` + `useBuyExtraRewardRoute` |
| 选包 | `accountStore.setCurrentPackage()` |
| 下一步 | `modalRouter.push('/orderSummary')` |
| KYC | `useIdentify().kycPopupByType('deposit')` |
| 恢复流程 | `tryDepositKycResumeNavigateToBuy()` |
| 关闭追踪 | `BuyModal` `track-on-close` DEPOSIT_EXIT |
| onMounted/Activated | `syncExtraRewardIntentFromSession` |

### order_summary — `pages/@buy/orderSummary.vue`

| 绑定 | 来源 |
|------|------|
| 当前套餐 | `accountStore.currentPackage` |
| 下一步 | `modalRouter.push('/paymentConfirm')` |

### payment_confirm — `pages/@buy/paymentConfirm.vue`

| 绑定 | 来源 |
|------|------|
| 支付通道 | `accountStore` deposit channels |
| Apple/Google Pay | `usePayment()` |
| 下一步 | `modalRouter.push('/paymentInvoice')` |

### payment_invoice — `pages/@buy/paymentInvoice.vue`

| 绑定 | 来源 |
|------|------|
| Paysafe | `usePaysafe()` |
| 存款 API | `usePayment()` 各 deposit 方法 |
| Pixel | `emitDepositSubmitTrack` |
| 欺詐 | `withRadarFraud('deposit')` |

---

## redeem 流程

### redeem — `pages/@redeem/redeem.vue` → `Redeem.vue`

| 绑定 | 来源 |
|------|------|
| middleware | `auth` + `permission: allowWithdraw` |
| 初始化 | `useWithdraw().initWithdrawSettings()` |
| 流水 | `getTurnoverInfo` / `canWithdraw` |
| 步骤 | step 1 金额 → 2 确认 → 3 成功 |
| 提交 | `Account.withdraw()` + `withRadarFraud('withdraw')` |
| 绑卡 | `handleAddBank` → 内嵌 AddBankCard / AddDebitCard |
| 成功跳转 | `router.push('/transaction?tab=redemptions')` |
| KYC | `useIdentify` beforeWithdraw |

### my_cards / add_*_card

| 页面 | composable |
|------|-----------|
| `myCards` | `useWithdraw` 绑卡列表 |
| `addBankCard` | `AddBankCard.vue` |
| `addDebitCard` | `AddDebitCard.vue` |
| `addEwalletCard` | `AddEwalletCard` |
| `addVirtualCard` | `AddVirtualCard` |

---

## receive — `pages/@receive/receive.vue`

| 绑定 | 来源 |
|------|------|
| 列表 | `ReceiveCenter/ReceiveList` |
| 领奖 | `promotionStore` claim 系列 |

---

## 游戏

### games/[gameCategory] — `pages/games/[gameCategory].vue`

| 绑定 | 来源 |
|------|------|
| 列表 | `useGame().getGames` / loadMore |
| 分类 | route param `gameCategory` |
| 网格 RWD | 3 列 mob；`.is-web` + 断点 6/8/11/15 列 |
| 卡片 | `GameListItem` → 启动游戏 |

### play — `pages/play.vue`

| 绑定 | 来源 |
|------|------|
| 启动 | `useGame().loadLaunchGame` |
| iframe | 隐藏 header/footer |
| Wake Lock | `useWakeLock` |
| 钱包 | `SwitchWalletDialog` |
| KYC | `openGameVerification` |
| 欺詐 | `withRadarFraud('gameLaunch')` |
| 客服 | ChatSDK |

### search / favourite — `pages/@search/`

| 绑定 | 来源 |
|------|------|
| 搜索 | `useGame` + `Search.vue` |
| 收藏 | `gameStore.favGameIds` |

---

## member 中心 — `pages/@member/`

| 路由 | 组件 | 关键绑定 |
|------|------|----------|
| `profile` | `ProfileView` | member, account, usePermissions |
| `account` | `AccountProfile` | member 资料更新 |
| `transaction` | `Transaction` | purchases / redemptions tabs |
| `activity` | `Activity` | 活动记录 |
| `inbox` | `Inbox` | `memberStore` 站内信 |
| `notice` | `Notice` | `commonStore` 公告 |
| `verifyPhone` | `VerifyPhone` | OTP |
| `verifyEmail` | `EmailForm` | OTP |
| `identifyVerify` | `IdentifyVerify` | KYC submit |
| `signIn` | `SignIn` | `getLoginPromotion` |
| `vipLevel` | `VipLevel` | VIP API |
| `responsible` | `Responsible` | 限额设定 |
| `gameExcluded` | `gameExcluded` | exclude turnover API |

**profile 快捷入口：**

- buy → `hasPermission('allowDeposit')` + `PlusModalLink to="/buy"`
- redeem → `hasPermission('allowWithdraw')` + `to="/redeem"`

---

## 活动 / 促銷

| 路由 | 组件 | API / Store |
|------|------|-------------|
| `promotions` | `promotions.vue` | `commonStore.getPromotions` |
| `invite` | `InviteFriends` 等 | `useInvite` |
| `lucky_bet` | `LuckyBet` | `promotion` lucky bet API |
| `rescue_fund` | `RescueFund` | savior promotion |
| `promo_code` | `PromoCode` | claimPromoCode |
| `promo_code_task` | task 组件 | promo task |
| `new_player_task` | `NewPlayerTask` | register promotion |
| `download` | `Download` | PWA / App 引导 |

---

## agent — `layout: agent`

| 路由 | 组件 | 绑定 |
|------|------|------|
| `agent` | `AgentLogin` | 代理登录，无 auth |
| `agentHome` | `AgentHome` | `useAgent` 团队总览 |
| `agentRegister` | `AgentRegister` | 推广链接 / 下线 |
| `agentProfile` | `AgentProfile` | 代理资料 |
| 判断 | `memberStore.isAgent` | type ∈ {1,2,41,42} |

**RWD：** `isWeb()` + `.is-web`（非 `useDevice`）。

---

## 侧栏 SideMenu 入口对照

| 链接 | 路由 |
|------|------|
| Buy | `/buy`（allowDeposit） |
| Redeem | `/redeem`（allowWithdraw） |
| Profile | `/profile` |
| Transaction | `/transaction` |
| Receive | `/receive` |
| Invite | `/invite` |
| Notice | `/notice` |
| Download | `/download` |
| Login / Register | `/login` `/register` |

---

## Composable 新建命名约定

从旧页面抽逻辑时：

```
pages/@buy/buy.vue          → useBuyFlow.ts
components/Redeem/Redeem.vue → useRedeemFlow.ts（或扩展现有 useWithdraw）
pages/@member/profile.vue  → useProfileFlow.ts（如需）
```

导出模式：

```ts
export function useBuyFlow() {
  // 搬迁原 script 逻辑
  return { /* props 映射 + handlers */ }
}
```
