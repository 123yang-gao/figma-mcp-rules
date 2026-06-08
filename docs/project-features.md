# Sweepstakes Shell 專案功能梳理

> 文件產生日期：2026-06-08  
> 專案：sweepstakes-shell（Nuxt 4 + Vue 3 + Pinia + Vant UI）  
> 用途：抽獎／Sweepstakes 活動前端 Shell，對接 WPS 後端 API

---

## 目錄

1. [專案概覽](#1-專案概覽)
2. [技術架構](#2-技術架構)
3. [路由與頁面功能](#3-路由與頁面功能)
4. [狀態管理（Pinia Stores）](#4-狀態管理pinia-stores)
5. [API 層](#5-api-層)
6. [核心 Composables](#6-核心-composables)
7. [中介層（Middleware）](#7-中介層middleware)
8. [插件初始化流程](#8-插件初始化流程)
9. [認證與帳戶安全](#9-認證與帳戶安全)
10. [金流：購買與兌換](#10-金流購買與兌換)
11. [遊戲系統](#11-遊戲系統)
12. [促銷與活動](#12-促銷與活動)
13. [代理系統](#13-代理系統)
14. [廣告追蹤（Pixel）](#14-廣告追蹤pixel)
15. [客服與多語系](#15-客服與多語系)
16. [安全與合規](#16-安全與合規)
17. [基礎設施與第三方整合](#17-基礎設施與第三方整合)
18. [目錄結構速查](#18-目錄結構速查)

---

## 1. 專案概覽

Sweepstakes Shell 是一個面向北美市場的 Sweepstakes 遊戲平台前端，支援：

- **雙錢包模式**：`sc`（Sweepstakes Coins / 真錢）與 `gc`（Gold Coins / 金幣）
- **多品牌部署**：透過 `VITE_MERCHANT` 環境變數切換品牌設定
- **模態路由架構**：大量功能以彈窗形式呈現，底層頁面不跳轉
- **多語系**：英文（EN-US）、西班牙文（ES-US）
- **行動優先**：響應式設計，支援 PWA、App 下載引導

---

## 2. 技術架構

### 核心技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Nuxt 4、Vue 3 Composition API |
| 狀態管理 | Pinia（手動 import，`storesDirs: []`） |
| UI 元件 | Vant 4、自訂 SCSS 元件 |
| 表單驗證 | Vee-Validate 4 |
| 國際化 | @nuxtjs/i18n |
| HTTP | Axios → `/wps/` 代理 |
| 路由模態 | nuxt-pages-plus（`PlusModalPage`） |
| 圖示 | nuxt-svgo（`<svgo-xxx />`） |
| 輪播 | nuxt-swiper / Swiper 12 |

### 路由模態架構

專案採用 **stub + modal** 雙層路由：

```
app/pages/buy.vue          → 空 stub，定義 definePageMeta（middleware、權限）
app/pages/@buy/buy.vue     → 實際 UI 元件
```

`app/app.vue` 註冊的模態群組：

`buy` · `auth` · `search` · `download` · `notice` · `luckyBet` · `vipLevel` · `newPlayerTask` · `member` · `redeem` · `invite` · `rescueFund` · `promoCode` · `receive`

### 佈局（Layouts）

| 佈局 | 檔案 | 用途 |
|------|------|------|
| `default` | `app/layouts/default.vue` | 主站（Header、Footer、SideMenu） |
| `agent` | `app/layouts/agent.vue` | 代理後台 |
| `custom` | `app/layouts/custom.vue` | 特殊頁（location、test） |

---

## 3. 路由與頁面功能

### 3.1 公開頁面

| 路由 | 檔案 | 功能說明 |
|------|------|----------|
| `/` | `pages/index.vue` | 首頁大廳：Banner、遊戲分類 slide（new/top/hot/rng/ac/tg）、廠商入口、金幣包（登入後）、Winner 榜 |
| `/games/[gameCategory]` | `pages/games/[gameCategory].vue` | 遊戲分類列表、分頁載入、收藏/最近遊戲 |
| `/promotions` | `pages/promotions.vue` | 活動中心：分類篩選、活動詳情彈窗、QuickPromo |
| `/help` | `pages/help.vue` | 說明中心（含 Postcard 等） |
| `/download` | `pages/download.vue` → `@download/` | App 下載引導 |
| `/location` | `pages/location.vue` | 地理位置限制說明頁，可聯繫客服 |
| `/test` | `pages/test.vue` | 開發測試頁 |

### 3.2 認證（模態 `@auth/`）

| 路由 | 模態實作 | 功能 |
|------|----------|------|
| `/login` | `@auth/login.vue` | 帳密 / SMS OTP / Firebase 登入 |
| `/register` | `@auth/register.vue` | Email / 手機 / Firebase 註冊 |
| `/forgot` | `@auth/forgot.vue` | 忘記密碼 |

### 3.3 金流（模態 `@buy/`、`@redeem/`）

| 路由 | 權限 | 功能 |
|------|------|------|
| `/buy` | `auth` + `allowDeposit` | 金幣商城（Coin Mall） |
| `/orderSummary` | auth | 訂單摘要 |
| `/paymentConfirm` | auth | 付款確認 |
| `/paymentInvoice` | auth | 付款發票 / 第三方支付表單 |
| `/redeem` | auth + `allowWithdraw` | 提現 / 兌換主流程 |
| `/myCards` | auth | 已綁定卡片列表 |
| `/addBankCard` | auth | 新增銀行卡 |
| `/addDebitCard` | auth | 新增借記卡 |
| `/addEwalletCard` | auth | 新增電子錢包 |
| `/addVirtualCard` | auth | 新增虛擬卡 |
| `/receive` | auth | 領獎中心 |

### 3.4 會員中心（模態 `@member/`）

| 路由 | 功能 |
|------|------|
| `/profile` | 個人資料 |
| `/account` | 帳戶設定 |
| `/transaction` | 交易紀錄（購買 / 兌換） |
| `/activity` | 活動紀錄 |
| `/inbox` | 站內信 |
| `/notice` | 公告 |
| `/verifyPhone` | 手機驗證 |
| `/verifyEmail` | Email 驗證 |
| `/identifyVerify` | KYC 身份驗證 |
| `/signIn` | 簽到活動 |
| `/vipLevel` | VIP 等級 |
| `/responsible` | 負責任博彩 / 限額設定 |
| `/gameExcluded` | 不計流水遊戲列表 |

### 3.5 遊戲

| 路由 | 功能 |
|------|------|
| `/play` | 遊戲 iframe 啟動頁（Wake Lock、錢包切換、Radar 檢查） |
| `/search` | 遊戲搜尋（`@search/search.vue`） |
| `/favourite` | 收藏遊戲（`@search/favourite.vue`） |

### 3.6 活動 / 促銷

| 路由 | 模態實作 | 功能 |
|------|----------|------|
| `/invite` | `@invite/invite.vue` | 邀請好友 |
| `/luckybet` | `@luckyBet/luckyBet.vue` | 幸運投注 |
| `/rescueFund` | `@rescueFund/rescueFund.vue` | 救援金 |
| `/promoCode` | `@promoCode/promoCode.vue` | 優惠碼輸入 |
| `/promoCodeTask` | `@promoCode/promoCodeTask.vue` | 優惠碼任務 |
| `/promoCodeReceived` | `@promoCode/promoCodeReceived.vue` | 優惠碼領取結果 |
| `/newPlayerTask` | `@newPlayerTask/newPlayerTask.vue` | 新手任務 |

### 3.7 代理系統（`layout: agent`）

| 路由 | 功能 |
|------|------|
| `/agent` | 代理登入（無需 auth） |
| `/agentHome` | 代理總覽儀表板 |
| `/agentRegister` | 建立下線 / 推廣連結 |
| `/agentProfile` | 代理個人資料 |

---

## 4. 狀態管理（Pinia Stores）

> 注意：Store 需手動 import，不會自動載入。

| Store | 檔案 | 管理內容 |
|-------|------|----------|
| **session** | `stores/session.ts` | 登入 token cookie、`isLoggedIn`、首次登入、密碼過期、Firebase 參數；actions：`normalLogin` / `firebaseLogin` / `registerEmail` / `registerOnlyMobile` / `logout` |
| **member** | `stores/member.ts` | 會員資料、頭像、安全設定、OTP 時間戳、站內信、Email 訂閱、VIP、KYC 狀態、自訂欄位、`isAgent` 判斷 |
| **account** | `stores/account.ts` | 雙錢包餘額（sc/gc）、存提款設定、支付通道、Coin Mall 套餐、Paysafe 卡片、發票流程、交易紀錄、綁卡資料 |
| **game** | `stores/game.ts` | 遊戲廠商映射、熱門遊戲、收藏 ID 集合 |
| **promotion** | `stores/promotion.ts` | 促銷票券、Temu 積分票、Extra Reward、優惠碼、幸運投注、成就/任務、廠商浮動活動、各類 popup 開關 |
| **common** | `stores/common.ts` | 系統狀態（維護/地區限制/白名單）、註冊欄位、客服列表、Banner/公告、Radar 設定、analytics domains、help center |
| **ui** | `stores/ui.ts` | 側邊選單開關 |

---

## 5. API 層

所有請求經 `app/apis/request.ts` 發送至 `/wps/...`，由 `server/routes/wps/[...path].ts` 代理至後端。

端點定義集中於 `app/config/api.ts`，API 模組分為：

| 模組 | 檔案 | 主要職責 |
|------|------|----------|
| **session** | `apis/session.ts` | 登入、登出、touch 心跳、captcha |
| **member** | `apis/member.ts` | 註冊、會員資料、驗證、KYC、站內信、VIP |
| **account** | `apis/account.ts` | 餘額、Coin Mall、存款/提款、綁卡、交易紀錄、玩家權限 |
| **game** | `apis/game.ts` | 遊戲列表、啟動、收藏、最近遊戲、排行榜 |
| **promotion** | `apis/promotion.ts` | 票券、促銷、邀請、救援金、幸運投注、成就、優惠碼、簽到、抽獎 |
| **agent** | `apis/agent.ts` | 團隊總覽、下線建立、推廣連結、返水設定 |
| **common** | `apis/common.ts` | 系統狀態、公告、OTP、Pixel、FCM、客服 script |

### Server 路由

| 路由 | 檔案 | 用途 |
|------|------|------|
| `/wps/*` | `server/routes/wps/[...path].ts` | API 代理 |
| `/api/manifest.json` | `server/routes/api/manifest.json.get.ts` | PWA manifest（依 query 動態） |
| `/api/health` | `server/routes/api/health.ts` | 健康檢查 |
| `/.well-known/apple-developer-merchantid-domain-association` | `server/routes/.well-known/*` | Apple Pay 網域驗證 |

---

## 6. 核心 Composables

| Composable | 用途 |
|------------|------|
| `useAuthLifecycle` | 登入/登出生命週期：touch 心跳、餘額刷新、收藏載入、KYC popup、pixel restore、成就載入、Radar identify |
| `useGame` | 遊戲列表分頁、啟動參數、`loadLaunchGame`（含 Radar gameLaunch） |
| `usePayment` | Apple Pay / Google Pay、deposit 流程 |
| `usePaysafe` | Paysafe SDK 卡片支付 |
| `useWithdraw` | 提款設定、流水檢查、綁卡表單驗證 |
| `useIdentify` | KYC popup 觸發（login/game/deposit/withdraw）、存款後恢復 buy 流程 |
| `usePermissions` | `allowDeposit` / `allowWithdraw` / `allowGameLaunch` 等玩家權限 |
| `usePixelTracker` | 多 provider 初始化、事件追蹤、登入後 server restore |
| `useRadarFraud` | Radar SDK + fraud plugin；包裝 login/register/deposit/withdraw/gameLaunch |
| `useInvite` | 邀請好友資料聚合（收入、排名、layout config） |
| `useAgent` | 代理連結建立、返水設定、下線註冊表單 |
| `useCs` / `useCsScripts` | 客服開窗、動態載入客服 script |
| `useGeetest` | Geetest v4 人機驗證 |
| `useGeoCache` | 瀏覽器 geolocation 快取（5 分鐘 TTL） |
| `useRegInfo` | 註冊归因資訊持久化（affiliate/referral code） |
| `useFirebase` | Firebase 第三方登入 |
| `useSms` / `useEmail` | OTP 發送與驗證 |
| `useRegisterState` | 註冊表單狀態機 |
| `useAdPopup` | 依使用者行為觸發廣告/公告 popup |
| `useUserActionTracker` | 追蹤 REGISTER、AFTER_LOGIN、GAME_EXIT 等事件 |
| `useDepositArrivalReport` | 登入後定時上報到帳彙總 |
| `useRaffle` | 抽獎活動 |
| `useBuyExtraRewardRoute` | Extra Reward → Buy 頁 session intent |
| `useBannerClick` | Banner 點擊導航 |
| `useImsSubscribe` | IMS 即時訊息訂閱（tcg-im） |
| `useSpeedTest` | CDN 測速回報 |
| `formRules` | VeeValidate 全域表單規則 |

---

## 7. 中介層（Middleware）

| 檔案 | 類型 | 行為 |
|------|------|------|
| `setup.global.ts` | global | 路由切換時節流刷新 `commonStore.getStatus()`（60s） |
| `reg-info.global.ts` | global | 客戶端首次保存註冊归因 `saveRegInfo()` |
| `track-referrer.global.ts` | global | 記錄 `previousRoute`（排除 search/play/favourite/buy/redeem/receive） |
| `userAction.global.ts` | global | `/register` 追蹤 REGISTER；離開 `/play` 追蹤 GAME_EXIT |
| `geolocation.global.ts` | global | **目前已註解停用**；原設計：無 geolocation 權限導向 `/location` |
| `auth.ts` | named | 未登入 → modal 導向 `/login` |
| `permission.ts` | named | 載入玩家權限，無權限 `replace("/")`（用於 buy/redeem） |

---

## 8. 插件初始化流程

執行順序（依檔名前綴）：

```
00.api.client.ts       → Axios response interceptors（token 過期、錯誤 dialog、i18n）
01.init.client.ts      → UUID、ImageFormat 偵測、Adjust S2S listener、iframe GO_BACK、Radar SDK init
02.persist-query.client.ts → URL 廣告參數持久化至 localStorage（fbclid、gclid、utm 等）
03.pixel.client.ts     → usePixelTracker().init()；監聽 login/register 成功後 fire pixel
10.init-stores.server.ts → SSR：commonStore + accountStore 初始化
ad-popup.client.ts     → 訂閱 eventUserAction bus → useAdPopup
block.client.ts        → DevTools 偵測阻擋
vant-lazyload.ts       → Vant 圖片懶載入
```

`app.vue` 額外全域初始化：`useAuthLifecycle()`、`createFormRules()`、`useCsScripts()`。

---

## 9. 認證與帳戶安全

### 登入方式

- 帳號密碼：`sessionStore.normalLogin` → `Session.login` + Radar token
- Firebase SSO：`firebaseLogin` / `firebaseRegister`
- SMS OTP：`Common.sendLoginOtp`
- Geetest v4 人機驗證

### 註冊方式

- Email 註冊：`registerEmail`（含 mail verification code）
- 僅手機：`registerOnlyMobile`
- Firebase 自動帳號：`registerAutoUsername`
- 自動附帶：归因資訊（affiliate/referral）、pixel track、loginDeviceId

### KYC 身份驗證

觸發時機（`useIdentify`）：

| 時機 | 說明 |
|------|------|
| `afterLoginVerification` | 登入後 |
| `openGameVerification` | 開啟遊戲前 |
| `beforeDepositVerification` | 存款前 |
| `beforeWithdrawVerification` | 提款前 |

相關元件：`IdentifyVerify.vue`、`KycPopup.vue`、`IdentifyFrame`（第三方 KYC iframe）

### 其他驗證

- 手機 / Email OTP（Member v2 verification）
- 支付密碼設定
- 密碼過期強制更換（`ChangePassword.vue`）
- 生日填寫 popup（`BirthdayPopup.vue`）
- 條款更新 popup（`TermsUpdatedPopup.vue`）

---

## 10. 金流：購買與兌換

### 購買流程（Buy / Coin Mall）

```
/buy → 選擇套餐 → /orderSummary → /paymentConfirm → /paymentInvoice → 存款 API
```

| 環節 | 說明 |
|------|------|
| 套餐資料 | `accountStore.getCoinMallPackage()` → `MCSFE_getCoinMallPackages` |
| 支付通道 | `getDepositPaymentChannels`；過濾 Apple Pay / Google Pay 可用性 |
| 預存款 | `getPreDeposit`（Paysafe 公鑰、已存卡片） |
| 存款方式 | LaunchUrl、GCash、QR、MT、PGMT、VirtualWallet、ManualTransfer 等 |
| KYC 攔截 | `useIdentify.kycPopupByType('deposit')` |
| Extra Reward | `promotionStore.buyPageShowExtraRewardPackages` |

支援的支付方式：

- Apple Pay（`usePayment` + server domain association）
- Google Pay（`pay.google.com/gp/p/js/pay.js`）
- Paysafe 卡片（`hosted.paysafe.com` SDK）
- 銀行轉帳 / QR Code / 電子錢包等多種通道

### 兌換流程（Redeem / Withdraw）

```
/redeem → 選擇提款方式 → 流水檢查 → 綁卡（如需）→ 提交提款
```

| 環節 | 說明 |
|------|------|
| 初始化 | `useWithdraw.initWithdrawSettings()` |
| 流水限制 | `getTurnoverInfo`；`canWithdraw` 依 status 判斷 |
| 綁卡 | `/addBankCard`、`/addEwalletCard`、`/addVirtualCard`、`/addDebitCard` |
| 提款 API | `Account.withdraw`（加密）、`preWithdrawTransaction` |
| 安全 | Radar `withRadarFraud('withdraw')` |

---

## 11. 遊戲系統

### 首頁遊戲展示

- 分類 slide：`new`、`top`、`hot`、`rng`、`ac`、`tg`
- 廠商入口：`HomeGameVendor`
- 遊戲選單：`HomeGameMenu`（登入後）

### 遊戲操作

| 功能 | 實作 |
|------|------|
| 分類列表 | `games/[gameCategory].vue` + `GameScrollLoad` |
| 搜尋 | `/search` |
| 收藏 | `addFavGame` / `removeFavGame`；`/favourite` |
| 啟動 | `useGame.loadLaunchGame` → `/play` iframe |
| 錢包切換 | `SwitchWalletDialog`（sc/gc） |
| 排除流水 | `Member.getExcludeTurnoverV2` → `/gameExcluded` |
| 廠商活動浮窗 | `promotionStore.getVendorEvent` |
| 權限控制 | `allowGameLaunch`（`usePermissions`） |
| 安全檢查 | Radar `gameLaunch` |

### 遊戲內功能

- Wake Lock（防止螢幕休眠）
- 隱藏 Header/Footer
- 遊戲內客服（ChatSDK）
- iframe `GO_BACK` 訊息處理

---

## 12. 促銷與活動

### 活動類型一覽

| 功能 | 元件 / API | 入口 |
|------|-----------|------|
| **票券中心** | `TicketEntry.client.vue` | 全域浮動入口（登入後） |
| **Temu 積分票** | `TemuScorePopup`、`claimScoreTickets` | promotion store |
| **Extra Reward** | `ExtraRewardsModal` | 領獎後跳轉 buy |
| **邀請好友** | `Invite/` 元件群、`useInvite` | `/invite` |
| **幸運投注** | `LuckyBet/LuckyBet.vue` | `/luckybet` |
| **救援金** | `Rescue/RescueFund.vue` | `/rescueFund` |
| **優惠碼** | `PromoCode/` 元件群 | `/promoCode*` |
| **新手任務** | `NewPlayerTask/NewPlayerTask.vue` | `/newPlayerTask` |
| **簽到** | `SignIn/SignIn.vue` | `/signIn` |
| **成就/任務** | `Achievement/` 元件群 | popup 入口 |
| **VIP 等級** | `VipLevel/VipLevel.vue` | `/vipLevel` |
| **領獎中心** | `ReceiveCenter/ReceiveList` | `/receive` |
| **活動公告** | `promotions.vue` | `/promotions` |
| **抽獎** | `useRaffle`、`PrizeWheel` | 活動內嵌 |
| **紅包雨** | `RedRain.vue` | 活動內嵌 |
| **Postcard** | `Help/Postcard.vue` | help 內 |

### 促銷類型代碼

`promotionStore.promoList` 動態組合：

`REGISTER` · `LOGIN` · `REFERRAL` · `SAVIOR` · `PROMOCODE` · `LUCKYBET` · `RECIEVEREWARDS` · `MEMBERLEVEL` 等

---

## 13. 代理系統

### 代理判斷

`memberStore.isAgent`：會員 type ∈ {1, 2, 41, 42}

### 功能模組

| 頁面 | 功能 |
|------|------|
| `/agent` | 代理登入 |
| `/agentHome` | 團隊總覽儀表板（`ODSFE2_getTeamOverviewSum`） |
| `/agentRegister` | 建立推廣連結 / 下線註冊 |
| `/agentProfile` | 代理個人資料 |

### 核心 API

- `POST /wps/agent/downline`（建立下線，加密）
- `MCSFE_createAffiliateUrl` / `viewAffiliateUrls` / `deleteAffiliateUrl`
- `MCSFE_getGlobalRebateSettingsByProductType`
- `MCSFE_viewRegisteredAffiliates`

### 元件

`app/components/Agent/`：`AgentLogin`、`AgentHome`、`AgentRegister`、`AgentRegisterCreateLink`、`AgentProfile` 等

---

## 14. 廣告追蹤（Pixel）

### 支援的 Provider

（`app/utils/pixel/providers/index.ts` 順序）

| Provider | 檔案 |
|----------|------|
| Facebook | `providers/fb.ts` |
| Google Analytics (gtag) | `providers/gtag.ts` |
| Google Tag Manager | `providers/gtm.ts` |
| TikTok | `providers/tiktok.ts` |
| AppsFlyer | `providers/appsflyer.ts` |
| Adjust | `providers/adjust.ts` |
| PropellerAds | `providers/propellerads.ts` |
| Okspin | `providers/okspin.ts` |
| Newsbreak | `providers/newsbreak.ts` |
| Snapchat | `providers/snapchat.ts` |
| RedTrack | `providers/redtrack.ts` |
| GlobalAttributions | `providers/globalattributions.ts` |

### 追蹤流程

1. **URL 參數持久化**：`02.persist-query.client.ts` 將 fbclid、gclid、utm 等存入 localStorage
2. **Provider 初始化**：`03.pixel.client.ts` → `usePixelTracker().init()`
3. **事件觸發**：login、register、deposit submit 等
4. **登入後還原**：`useAuthLifecycle` → `restoreFromServer()` → `WPSCORE_getPixelTrack`
5. **到帳上報**：`useDepositArrivalReport` 定時上報

### Affiliate URL 正規化

`app.vue` inline script：子網域自動轉 `www` + `affiliateCode` query 參數

---

## 15. 客服與多語系

### 多語系（i18n）

| 設定 | 值 |
|------|-----|
| 語系 | EN-US（預設）、ES-US |
| 策略 | `no_prefix`（URL 無語系前綴） |
| 同步方式 | `pnpm i18n` 從 Google Sheets 同步（**禁止手動編輯** `i18n/locales/`） |
| 使用規範 | 所有 UI 字串必須用 `$t('key')` |

### 客服（CS）

| 環節 | 實作 |
|------|------|
| 資料來源 | `commonStore.customerService`（來自 system/status） |
| 開啟客服 | `useCs.openCs()` |
| 特殊處理 | TextEdge / WellyTalk（`useCs.ts`） |
| 動態 script | `WPSCORE_getCustomerServiceScript`（`useCsScripts`） |
| 遊戲內客服 | `play.vue` → ChatSDK.showChat / hideChat |
| FCM 推播 | `common.fcmBind` / `fcmSubscribe` / `fcmUnsubscribe` |

---

## 16. 安全與合規

| 機制 | 實作 | 說明 |
|------|------|------|
| **地區限制** | `commonStore.regionRestriction` | 顯示 `Error403` |
| **維護模式** | `commonStore.maintenance` | 顯示 `Maintenance` |
| **白名單** | `commonStore.whitelist` | status API 回傳 |
| **Geolocation** | `useGeoCache`、`location.vue` | middleware 已停用 |
| **Radar 欺詐** | `useRadarFraud.ts` | 攔截 login/register/deposit/withdraw/gameLaunch |
| **Geetest** | `useGeetest.ts` | OTP/登入人機驗證 |
| **DevTools 阻擋** | `block.client.ts` | `devtools-detector`；白名單 bypass |
| **請求加密** | `config/api.ts` `encrypt: true` | login、register、withdraw、bindBankCard 等 |
| **BFCache 禁用** | `nuxt.config routeRules` | 全域 `cache-control: no-store` |
| **玩家權限** | `usePermissions` | 後端 `getPlayerPermissions` 控制 deposit/withdraw/game |
| **密碼過期** | `sessionStore.passwordExpired` | 強制改密碼 popup |
| **負責任博彩** | `Responsible/` 元件 | 限額設定、歷史紀錄 |

---

## 17. 基礎設施與第三方整合

| 整合 | 用途 |
|------|------|
| **tcg-im** | IMS 即時訊息 |
| **Firebase** | 第三方 SSO 登入 |
| **Radar SDK** | 欺詐偵測（`radar-sdk-js` + `@radarlabs/plugin-fraud`） |
| **Geetest** | 人機驗證 |
| **Apple Pay** | 行動支付 + server domain association |
| **Google Pay** | 行動支付 |
| **Paysafe** | 卡片支付 SDK |
| **Google Maps** | 地址自動完成（`useGooglePlacesAutocomplete`） |
| **MapLibre GL** | 地圖顯示 |
| **html2canvas** | 截圖功能 |
| **qrcode.vue** | QR Code 生成 |
| **compressorjs** | 圖片壓縮（KYC 上傳） |
| **detectincognitojs** | 無痕模式偵測 |
| **PWA** | `/api/manifest.json` 動態 manifest |
| **CDN 測速** | `useSpeedTest` → `WPSCORE_postbackSpeedTestResult` |

### 品牌多租戶

透過 `VITE_MERCHANT` 環境變數驅動：

- Logo / Favicon
- Image CDN
- Merchant code
- 品牌標題

切換品牌：

```bash
cp .env .env.local
# 修改 VITE_MERCHANT
```

---

## 18. 目錄結構速查

```
sweepstakes-shell/
├── app/
│   ├── apis/              # API 請求模組（session/member/account/game/promotion/agent/common）
│   ├── assets/            # 靜態資源（icons、imgs、css）
│   ├── components/        # Vue 元件（254+ 個）
│   ├── composables/       # 組合式函式（45 個）
│   ├── config/            # API 端點定義（api.ts）
│   ├── layouts/           # 佈局（default/agent/custom）
│   ├── middleware/        # 路由中介層（7 個）
│   ├── pages/             # 頁面路由（86 個，含 @modal 子路由）
│   ├── plugins/           # Nuxt 插件（8 個）
│   ├── stores/            # Pinia stores（7 個）
│   ├── types/             # TypeScript 型別定義
│   └── utils/             # 工具函式（含 pixel providers）
├── i18n/                  # 多語系設定與 locale 檔案
├── server/                # Nitro server（API 代理、manifest、health）
├── scripts/               # 建置腳本（i18n 同步等）
├── docs/                  # 專案文件
├── nuxt.config.ts         # Nuxt 設定
└── package.json           # 依賴與腳本
```

### 常用開發指令

```bash
pnpm dev          # 開發伺服器（port 4000）
pnpm dev:local    # 使用 .env.local
pnpm build        # 建置
pnpm build:prod   # 生產環境建置
pnpm lint         # ESLint + Stylelint
pnpm type-check   # TypeScript 型別檢查
pnpm i18n         # 從 Google Sheets 同步多語系
```

---

*本文件依專案原始碼梳理，涵蓋截至 2026-06-08 的功能模組。若需某一模組的更深層 API 清單或流程圖，可指定模組名稱再展開。*
