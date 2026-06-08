# Figma 图层命名规范（设计师版）

> 参考稿：[jefescus1 首页](https://www.figma.com/design/GjC6o0iZS9hxJErcsCbKTn/?node-id=3061-257733)

## 你要做的事

1. 给**页面**和**主要区块**起英文名（不用拆 Figma 组件）
2. 可点击的元素加 `btn/` `link/` `input/` 前缀
3. 交互看不懂的，在 Dev Mode **写标注**

---

## 命名格式

```
页面 Frame：  page/{页面}_{guest|member}_{web|mob}_{宽度}
页面内区块：  sec/{名称}
列表：        list/game_{分类}        ← 多个列表必须区分
按钮：        btn/{动作}
链接：        link/to_{目标页}
输入框：      input/{字段}
弹窗内容：    modal/{名称}
特殊状态：    state/{empty|loading|error}
纯装饰：      dec/{名称}              ← 开发会忽略
```

**规则：** 英文小写 + 下划线，不用空格，不用中文，不用 `Frame 1261153704` 这种默认名。

---

## 页面怎么命名

```
page/home_guest_web_1920      ← 首页 / 未登录 / 桌面 / 1920宽
page/home_member_mob_375      ← 首页 / 已登录 / 手机 / 375宽
page/login_guest_mob_375      ← 登录弹窗
page/buy_member_mob_375       ← 金币商城
```

| 字段 | 填什么 |
|------|--------|
| 页面 | 见下方路由表 |
| 状态 | `guest` 未登录 / `member` 已登录 |
| 端 | `web`（1920或1366）/ `mob`（375） |

**❌ 错误示例**

| 不要这样写 | 应该这样写 |
|-----------|-----------|
| `jefescus1_before login_1920` | `page/home_guest_web_1920` |
| `jefescus1_mob_popup_login` | `page/login_guest_mob_375` |
| `Frame 1261153704` | `sec/content` 或直接删掉 |

品牌名不写进图层名，文件名区分品牌即可。

---

## 路由名对照表

### 主站

| 路由名 | 页面 |
|--------|------|
| `home` | 首页 |
| `games` | 游戏分类 |
| `promotions` | 活动中心 |
| `help` | 帮助中心 |
| `download` | App 下载 |
| `play` | 游戏内页 |
| `search` | 游戏搜索 |
| `favourite` | 收藏游戏 |
| `side_menu` | 侧边菜单 |

### 登录注册

| `login` | 登录 | `register` | 注册 | `forgot` | 忘记密码 |

### 购买 / 提现

| `buy` | 金币商城 | `order_summary` | 订单摘要 | `payment_confirm` | 付款确认 |
| `payment_invoice` | 付款发票 | `redeem` | 提现 | `my_cards` | 我的卡片 |
| `add_bank_card` | 银行卡 | `add_debit_card` | 借记卡 | `add_ewallet_card` | 电子钱包 |
| `add_virtual_card` | 虚拟卡 | `receive` | 领奖中心 |

### 会员中心

| `profile` | 个人中心 | `account` | 账户设置 | `transaction` | 交易记录 |
| `activity` | 活动记录 | `inbox` | 站内信 | `notice` | 公告 |
| `verify_phone` | 手机验证 | `verify_email` | 邮箱验证 | `identify_verify` | KYC |
| `sign_in` | 签到 | `vip_level` | VIP | `responsible` | 负责任博彩 |
| `game_excluded` | 不计流水游戏 |

### 活动

| `invite` | 邀请好友 | `lucky_bet` | 幸运投注 | `rescue_fund` | 救援金 |
| `promo_code` | 优惠码 | `promo_code_task` | 优惠码任务 | `new_player_task` | 新手任务 |

### 代理

| `agent` | 代理登录 | `agent_home` | 代理首页 | `agent_register` | 推广链接 | `agent_profile` | 代理资料 |

> 新页面先找开发确认路由名。

---

## 首页图层树（照着改）

**改造前 → 改造后：**

```
jefescus1_before login_1920          →  page/home_guest_web_1920
├── IMG_repeat                       →  dec/bg_repeat
├── Frame 1261153704                 →  （删掉）
│   ├── header_                      →  sec/header
│   ├── BANNER                       →  sec/banner
│   ├── container_gamelist           →  list/game_new
│   ├── container_gamelist           →  list/game_top
│   ├── Provider                     →  sec/vendor
│   ├── container_gamelist           →  list/game_tg
│   ├── container_gamelist           →  list/game_hot
│   ├── container_gamelist           →  list/game_rng
│   └── FOOTER_                      →  sec/footer
```

**登录后首页多加：**

```
sec/game_nav          分类 Tab
sec/coin_packages     金币包
sec/bottom_footer     手机底栏
sec/winner            中奖榜
```

**游戏列表后缀（多个列表不能同名）：**

`new` `top` `hot` `rng` `ac` `tg` `fav` `recent`

---

## 弹窗页面

```
page/login_guest_mob_375
├── dec/bg_dimmed              遮罩
└── modal/login_form           弹窗内容
    ├── sec/modal_header       标题 + 关闭
    ├── input/username
    ├── input/password
    ├── btn/submit
    ├── link/to_register
    └── link/to_forgot
```

---

## 标注（Dev Mode 必填）

命名说不清的行为，必须写标注：

| 什么时候写 | 写什么 |
|-----------|--------|
| 按钮跳转 | `点击 → 打开 /buy` |
| 有条件才显示 | `需登录` / `需 allowDeposit 权限` |
| 多步骤 | `选套餐 → order_summary` |
| KYC 拦截 | `未通过 KYC 弹窗拦截` |
| 多状态 | `无数据时显示 state/empty` |

文案走多语言系统，图层名里不要写「立即购买」这种展示文字。

---

## 交付前检查

- [ ] 页面 Frame 命名正确（`page/...`）
- [ ] 没有 `Frame xxx` 默认名
- [ ] 游戏列表有分类后缀（`list/game_new` 不是 `container_gamelist`）
- [ ] 按钮/链接/输入框有前缀
- [ ] 交互写了标注
- [ ] web 和 mob 有对应稿，命名一致

---

## 一句话总结

> **页面名 = 路由，区块名 = 功能，标注 = 点击后干什么。**
