# 🌐 Cloudflare Worker 在线环境测试报告 (Online)

## 📊 测试概览

**测试时间**: 2025/09/20 15:51:42
**测试环境**: 在线环境 (beta.plaud.ai)
**测试文件**: online-routing.test.ts
**总测试数**: 31
**通过**: 31 ✅
**失败**: 0 ❌
**跳过**: 0 ⏭️
**成功率**: 100.0%

## 🌐 在线环境配置

- **域名**: beta.plaud.ai (公测环境)
- **默认资源**: plaud-web.pages.dev (旧版本)
- **新版本资源**: beta.plaud-web.pages.dev
- **默认灰度**: 0% (保守发布策略)
- **白名单域名**: api.plaud.ai, www.plaud.ai, plaud.ai

## 🎯 测试状态

🎉 **所有在线测试通过！**

## 📋 详细结果

### 📁 online-routing.test.ts

#### online.hashStringToPercentage - 在线环境哈希算法

- ✅ **应该返回一致的哈希百分比** (3个)
- ✅ **相同字符串应该返回相同结果** (1个)
- ✅ **应该返回 0-99 范围内的值** (100个)

#### buildNewPagesOrigin - 在线域名构建

- ✅ **应该处理 beta.plaud.ai 子域名** (2个)
- ✅ **应该处理根域名 plaud.ai** (1个)
- ✅ **应该处理白名单域名** (2个)
- ✅ **应该处理复杂子域名** (1个)

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线路由逻辑测试 - beta.plaud.ai 域名

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/dashboard | 在线环境默认0%灰度 - 所有用户使用旧版本 | beta_user789 | - | 0% | plaud-web.pages.dev | ❌ 未命中 (34% > 0%) | ✅ | 5个 |
| beta.plaud.ai/* | 在线环境10%灰度 - 低哈希用户命中新版本 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 2个 |
| beta.plaud.ai/dashboard | 在线环境40%灰度 - 低哈希用户命中新版本 | beta_user789 | - | 40% | beta.plaud-web.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 3个 |
| beta.plaud.ai/dashboard | 环境头应该优先于灰度逻辑 | beta_user123 | staging | 0% | staging.plaud-web.pages.dev | 🔄 环境头优先 | ✅ | 2个 |
| beta.plaud.ai/dashboard | 没有客户端标签应该默认旧版本 | 无 | - | 50% | plaud-web.pages.dev | ❌ 默认旧版本 | ✅ | 4个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线域名映射测试 - beta.plaud.ai 环境

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/dashboard | 访问 beta.plaud.ai 应该返回 beta.plaud-web.pages.dev | beta_user789 | - | 40% | beta.plaud-web.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 2个 |
| app.plaud.ai/profile | 访问 app.plaud.ai 应该返回 app.plaud-web.pages.dev | beta_user789 | - | 40% | app.plaud-web.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 2个 |
| api.plaud.ai/v1/users | 访问 api.plaud.ai 白名单域名保持原样 | beta_user456 | staging (无效) | 50% | api.plaud.ai | ⚪ 白名单域名 | ✅ | 2个 |
| plaud.ai/home | 访问根域名 plaud.ai 白名单域名保持原样 | beta_user789 | - | 50% | plaud.ai | ⚪ 白名单域名 | ✅ | 2个 |
| www.plaud.ai/about | 访问 www.plaud.ai 白名单域名保持原样 | 无 | prod (无效) | 50% | www.plaud.ai | ⚪ 白名单域名 | ✅ | 2个 |
| beta.plaud.ai/dashboard | 高哈希用户访问 beta.plaud.ai 应该返回旧版本域名 | beta_user789 | - | 40% | beta.plaud-web.pages.dev | ✅ 命中 (34% < 40%) | ✅ | 3个 |
| beta.plaud.ai/* | 环境头优先级测试 - 即使是旧版本用户也会路由到指定环境 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 2个 |
| beta.plaud.ai/* | 复杂子域名测试 - admin.api.plaud.ai | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 2个 |
| beta.plaud.ai/* | 带查询参数的URL应该保持参数 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 2个 |
| beta.plaud.ai/* | 白名单域名测试 - 环境头对白名单域名无效 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 2个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线灰度发布场景测试

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/test | 0%灰度 - 所有用户都使用旧版本 | beta_user_a~c | - | 0% | plaud-web.pages.dev | ❌ 全部旧版本 | ✅ | 6个 |
| beta.plaud.ai/* | 5%灰度 - 极少数用户命中新版本 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 3个 |
| beta.plaud.ai/* | 50%灰度 - 约一半用户命中新版本 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 20个 |
| beta.plaud.ai/test | 100%灰度 - 所有用户都使用新版本 | beta_user_x~z | - | 100% | beta.plaud-web.pages.dev | ✅ 全部新版本 | ✅ | 6个 |
| beta.plaud.ai/rollout | 在线渐进式发布模拟 - 从0%到100% | beta_consistent_user | - | 0%→100% | 渐进式命中 | 📈 渐进式发布 | ✅ | 14个 |

#### Online Routing Logic (beta.plaud.ai 在线环境) › 在线环境特殊场景测试

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| beta.plaud.ai/* | 旧路由强制使用旧版本 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 3个 |
| beta.plaud.ai/* | 环境头与灰度的优先级 - 环境头覆盖灰度逻辑 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 4个 |
| beta.plaud.ai/* | 应该正确处理复杂的 URL | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 3个 |
| beta.plaud.ai/* | 应该返回完整的调试信息 | beta_user | - | 0% | plaud-web.pages.dev | 🌐 在线环境 | ✅ | 10个 |



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
- **环境路由**: 支持通过 x-pld-env header 指定目标环境
- **域名映射**: beta.plaud.ai -> beta.plaud-web.pages.dev
- **白名单机制**: API域名不做路由处理，保持原样

### 🛡️ 安全策略
- **保守发布**: 默认0%灰度，确保线上稳定性
- **渐进式发布**: 支持从0%逐步扩大到100%
- **回滚机制**: 可快速调整灰度百分比
- **环境隔离**: 线上环境独立配置

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

*报告生成时间: 2025/09/20 15:51:42*
*测试框架: Jest | 环境: 在线 (beta.plaud.ai)*
