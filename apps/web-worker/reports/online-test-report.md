# 🌐 Cloudflare Worker 在线环境测试报告 (Online)

## 📊 测试概览

**测试时间**: 2025/09/20 17:57:52
**测试环境**: 在线环境 (beta.plaud.ai)
**测试文件**: online-routing.test.ts
**总测试数**: 36
**通过**: 36 ✅
**失败**: 0 ❌
**跳过**: 0 ⏭️
**成功率**: 100.0%

## 🌐 在线环境配置

- **域名**: beta.plaud.ai (公测环境)
- **旧版本资源**: plaud-web-dist.pages.dev (旧项目)
- **新版本资源**: plaud-web3.pages.dev (新项目)
- **默认灰度**: 100% (升级策略)
- **劫持域名**: beta.plaud.ai (固定劫持)

## 🎯 测试状态

🎉 **所有在线测试通过！**

## 📋 详细结果

### 📁 online-routing.test.ts

#### online.hashStringToPercentage - 在线环境哈希算法

- ✅ **应该返回一致的哈希百分比** (3个)
- ✅ **相同字符串应该返回相同结果** (1个)
- ✅ **应该返回 0-99 范围内的值** (10个)

#### buildNewPagesOrigin - 在线域名构建

- ✅ **应该处理 beta.plaud.ai 子域名** (2个)
- ✅ **应该统一映射到新版本域名** (5个)

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线路由逻辑测试 - beta.plaud.ai 域名

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/* | 在线环境默认100%灰度 - 所有用户使用新版本 | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境10%灰度 - 高哈希用户不命中新版本 | beta_user789 | - | 10% | plaud-web-dist.pages.dev | ❌ 未命中 (34% > 10%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境40%灰度 - 低哈希用户命中新版本 | beta_user789 | - | 40% | plaud-web3.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 没有客户端标签应该默认新版本 - 50%灰度 | - | - | 50% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 没有客户端标签应该默认新版本 - 0%灰度 | - | - | 0% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 没有客户端标签应该默认新版本 - 100%灰度 | - | - | 0% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 空Cookie头应该默认新版本 | - | - | 30% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 只有其他Cookie没有x-pld-tag应该默认新版本 | - | - | 25% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | x-pld-tag为空值应该默认新版本 | - | - | 10% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境5%灰度 - 极低哈希用户才命中新版本 | user789 | - | 5% | plaud-web-dist.pages.dev | ❌ 未命中 (15% > 5%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境20%灰度 - 低哈希用户命中新版本 | user789 | - | 20% | plaud-web3.pages.dev | ✅ 命中 (15% < 20%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境75%灰度 - 中等哈希用户命中新版本 | user123 | - | 75% | plaud-web3.pages.dev | ✅ 命中 (73% < 75%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 在线环境70%灰度 - 高哈希用户不命中新版本 | beta_user123 | - | 70% | plaud-web-dist.pages.dev | ❌ 未命中 (76% > 70%) | ✅ | 1个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线域名映射测试 - beta.plaud.ai 环境

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/dashboard | 访问 beta.plaud.ai 应该返回 plaud-web3.pages.dev | beta_user789 | - | 40% | plaud-web3.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 1个 |
| app.plaud.ai/profile | 访问 app.plaud.ai 应该返回 plaud-web3.pages.dev | beta_user789 | - | 40% | plaud-web3.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 1个 |
| beta.plaud.ai/dashboard | 高哈希用户访问 beta.plaud.ai 应该返回旧版本域名 | beta_user789 | - | 40% | plaud-web3.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 1个 |
| beta.plaud.ai/* | 复杂子域名测试 - admin.api.plaud.ai | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 1个 |
| beta.plaud.ai/* | 带查询参数的URL应该保持参数 | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 没有用户标识访问 beta.plaud.ai 应该返回新版本域名 | - | - | 5% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |
| app.plaud.ai/profile | 没有用户标识访问 app.plaud.ai 应该返回新版本域名 | - | - | 5% | plaud-web3.pages.dev | ✅ 默认新版本 | ✅ | 1个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线灰度发布场景测试

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/test | 0%灰度 - 所有用户都使用旧版本 | beta_user_a~c | - | 0% | plaud-web-dist.pages.dev | ❌ 全部旧版本 | ✅ | 3个 |
| beta.plaud.ai/* | 5%灰度 - 极少数用户命中新版本 | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 3个 |
| beta.plaud.ai/* | 50%灰度 - 约一半用户命中新版本 | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 15个 |
| beta.plaud.ai/test | 100%灰度 - 所有用户都使用新版本 | beta_user_x~z | - | 100% | plaud-web3.pages.dev | ✅ 全部新版本 | ✅ | 3个 |
| beta.plaud.ai/rollout | 在线渐进式发布模拟 - 从0%到100% | beta_consistent_user | - | 0%→100% | 渐进式命中 | 📈 渐进式发布 | ✅ | 13个 |
| beta.plaud.ai/no-user-test | 没有用户标识在各种灰度下都使用新版本 | - | - | 0%~100% | plaud-web3.pages.dev | ✅ 全灰度新版本 | ✅ | 21个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线环境特殊场景测试

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/legacy/admin | 旧路由强制使用旧版本 | beta_user789 | - | 50% | plaud-web-dist.pages.dev | 🔄 旧路由优先 | ✅ | 1个 |
| beta.plaud.ai/dashboard | 高哈希用户在低灰度下应该使用旧版本 | beta_user123 | - | 50% | plaud-web-dist.pages.dev | ❌ 未命中 (76% > 50%) | ✅ | 1个 |
| beta.plaud.ai/legacy/settings | 没有用户标识访问旧路由应该使用旧版本 | - | - | 100% | plaud-web-dist.pages.dev | 🔄 旧路由优先 | ✅ | 1个 |
| beta.plaud.ai/* | 应该正确处理复杂的 URL | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 1个 |
| beta.plaud.ai/* | 应该返回完整的调试信息 | - | - | 0% | plaud-web3.pages.dev | 🌐 在线环境 | ✅ | 3个 |



## 📁 项目结构

```
apps/web-worker/
├── src/
│   ├── offline.worker.js                    # 离线 Worker 逻辑 (theplaud.com)
│   ├── online.worker.js                     # 在线 Worker 逻辑 (beta.plaud.ai)
│   ├── shared-logic.js                      # 共享工具函数
│   └── index.ts                             # 入口文件
├── tests/
│   ├── routing-logic.test.ts                # 离线路由逻辑测试
│   ├── online-routing.test.ts               # 在线路由逻辑测试
│   └── test-utils.ts                        # 测试工具函数
├── scripts/
│   ├── generate-offline-test-report.ts      # 离线测试报告生成器
│   └── generate-online-test-report.ts       # 在线测试报告生成器
├── cloudflare-worker-offline.js             # 离线完整 Worker
├── cloudflare-worker-online.js              # 在线完整 Worker
└── reports/
    ├── latest-test-report.md                # 离线测试报告
    └── online-test-report.md                # 在线测试报告
```

## 🔧 在线环境特性

### 🎯 路由逻辑
- **灰度发布**: 基于用户标识的哈希值进行流量分配
- **域名映射**: beta.plaud.ai -> plaud-web3.pages.dev (新版本) / plaud-web-dist.pages.dev (旧版本)
- **固定劫持**: 只处理 beta.plaud.ai/* 路径，统一映射到新版本域名

### 🛡️ 升级策略
- **全面升级**: 默认100%灰度，全量使用新版本
- **灵活控制**: 支持调整灰度百分比进行精细控制
- **快速回滚**: 可快速调整灰度百分比进行回滚
- **环境隔离**: 在线环境独立配置

### 🧪 测试覆盖
- 哈希算法一致性测试
- Cookie 解析功能测试
- 域名构建逻辑测试
- 完整路由流程测试
- 灰度发布场景测试
- 环境头优先级测试
- 白名单域名测试
- 渐进式发布模拟

---

*报告生成时间: 2025/09/20 17:57:52*
*测试框架: Jest | 环境: 在线 (beta.plaud.ai)*
