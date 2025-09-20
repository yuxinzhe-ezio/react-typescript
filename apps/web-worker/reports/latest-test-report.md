# 🧪 Cloudflare Worker 路由逻辑测试报告

## 📊 测试概览

**测试时间**: 2025/09/20 12:23:27
**测试文件**: 所有测试文件
**总测试数**: 42
**通过**: 42 ✅
**失败**: 0 ❌
**跳过**: 0 ⏭️
**成功率**: 100.0%

## 🎯 测试状态

🎉 **所有测试通过！**

## 📋 详细结果

### 📁 routing-logic.test.ts

#### hashStringToPercentage

- ✅ **应该返回一致的哈希百分比** (3个)
- ✅ **相同字符串应该返回相同结果** (1个)
- ✅ **应该返回 0-99 范围内的值** (200个)

#### parseCookies

- ✅ **应该解析简单的 cookies** (1个)
- ✅ **应该处理 x-pld-tag cookie** (1个)
- ✅ **应该处理空的 cookie header** (2个)

#### buildNewPagesOrigin

- ✅ **应该处理子域名** (2个)
- ✅ **应该处理根域名** (1个)

#### Routing Logic (灰度发布和路由转发) › testRouting - 核心路由逻辑测试

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| app.theplaud.com/dashboard | 低哈希用户应该路由到新版本 | user789 | - | 50% | app.plaud-web3.pages.dev | ✅ 命中 (15% < 50%) | ✅ | 4个 |
| app.theplaud.com/dashboard | 高哈希用户应该路由到旧版本 | user123 | - | 50% | test.plaud-web-dist.pages.dev | ❌ 未命中 (73% > 50%) | ✅ | 4个 |
| admin.theplaud.com/legacy/users | 旧路由应该强制使用旧版本 | user789 | - | 50% | test.plaud-web-dist.pages.dev | 强制旧版本 (/legacy) | ✅ | 3个 |
| app.theplaud.com/dashboard | 环境头应该优先于其他逻辑 | user123 | staging | 0% | staging.plaud-web3.pages.dev | 🔄 环境头优先 | ✅ | 2个 |
| app.theplaud.com/dashboard | 没有客户端标签应该默认旧版本 | 无 | - | 50% | test.plaud-web-dist.pages.dev | ❌ 默认旧版本 | ✅ | 4个 |
| app.theplaud.com/dashboard | 100% 灰度应该所有用户都是新版本 | user123 | - | 100% | app.plaud-web3.pages.dev | ✅ 命中 (73% < 100%) | ✅ | 2个 |
| app.theplaud.com/dashboard | 0% 灰度应该所有用户都是旧版本 | user789 | - | 0% | test.plaud-web-dist.pages.dev | ❌ 未命中 (15% > 0%) | ✅ | 2个 |
| admin.theplaud.com/v1/users?id=123&type=admin | 应该正确处理复杂的 URL | admin | - | 50% | test.plaud-web-dist.pages.dev | ❌ 未命中 (51% > 50%) | ✅ | 3个 |
| app.theplaud.com/dashboard | 应该返回完整的调试信息 | testuser | - | 30% | test.plaud-web-dist.pages.dev | ❌ 未命中 (75% > 30%) | ✅ | 10个 |

#### Routing Logic (灰度发布和路由转发) › Hostname 路由映射测试 - 不同请求情况的域名返回

| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |
|----------|---------|----------|-----------|-------|----------|----------|------|---------|
| test.theplaud.com/dashboard | 访问 test.theplaud.com 应该返回 test.plaud-web3.pages.dev | user789 | - | 50% | test.plaud-web3.pages.dev | ✅ 命中 (15% < 50%) | ✅ | 2个 |
| test.theplaud.com/api | 访问 test.theplaud.com 带 x-pld-env: test3 应该返回 test3.plaud-web3.pages.dev | user123 | test3 | 50% | test3.plaud-web3.pages.dev | 🔄 环境头优先 | ✅ | 2个 |
| app.theplaud.com/profile | 访问 app.theplaud.com 应该返回 app.plaud-web3.pages.dev | user789 | - | 50% | app.plaud-web3.pages.dev | ✅ 命中 (15% < 50%) | ✅ | 2个 |
| api.theplaud.com/v1/users | 访问 api.theplaud.com 白名单域名保持原样 | user456 | staging (无效) | 50% | api.theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| theplaud.com/home | 访问根域名 theplaud.com 白名单域名保持原样 | user789 | - | 50% | theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| www.theplaud.com/about | 访问 www.theplaud.com 白名单域名保持原样 | 无 | prod (无效) | 50% | www.theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| test.theplaud.com/dashboard | 高哈希用户访问 test.theplaud.com 应该返回旧版本域名 | user123 | - | 50% | test.plaud-web-dist.pages.dev | ❌ 未命中 (73% > 50%) | ✅ | 3个 |
| admin.api.theplaud.com | 复杂子域名测试 - admin.api.theplaud.com | admin | - | 100% | test.plaud-web3.pages.dev | ✅ 命中 (51% < 100%) | ✅ | 2个 |
| api.theplaud.com/v1/users | 白名单域名测试 - api.theplaud.com 不做路由处理 | user789 | - | - | api.theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| www.theplaud.com/about | 白名单域名测试 - www.theplaud.com 不做路由处理 | user123 | - | - | www.theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| app.theplaud.com/dashboard | 环境头优先级测试 - 即使是旧版本用户也会路由到指定环境 | user123 | dev | 50% | dev.plaud-web3.pages.dev | 🔄 环境头优先 | ✅ | 2个 |
| app.theplaud.com/dashboard?id=123 | 带查询参数的URL应该保持参数 | user789 | test3 | 50% | test3.plaud-web3.pages.dev | 🔄 环境头优先 | ✅ | 2个 |
| api.theplaud.com/v1/users | 白名单域名测试 - 环境头对白名单域名无效 | user789 | staging (无效) | - | api.theplaud.com | ⚪ 白名单域名 | ✅ | 2个 |
| app.theplaud.com/dashboard | 30% 灰度 - 低哈希用户命中新版本 | user789 | - | 30% | app.plaud-web3.pages.dev | ✅ 命中 (15% < 30%) | ✅ | 4个 |
| app.theplaud.com/dashboard | 30% 灰度 - 高哈希用户不命中灰度使用旧版本 | user123 | - | 30% | test.plaud-web-dist.pages.dev | ❌ 未命中 (73% > 30%) | ✅ | 4个 |
| app.theplaud.com/dashboard | 80% 灰度 - 中等哈希用户命中新版本 | user456 | - | 80% | test.plaud-web-dist.pages.dev | ❌ 未命中 (94% > 80%) | ✅ | 3个 |
| app.theplaud.com/dashboard | 50% 灰度边界测试 - 哈希值正好等于灰度值 | boundary50 | - | 50% | 基于哈希值 | 🎯 边界测试 | ✅ | 3个 |
| app.theplaud.com/dashboard | 不同用户在相同灰度下的分布测试 | user_a~e | - | 60% | 新/旧版本分布 | 📊 分布测试 | ✅ | 21个 |
| app.theplaud.com/dashboard | 灰度与环境头的优先级 - 环境头覆盖灰度逻辑 | user123 | staging | 20% | staging.plaud-web3.pages.dev | 🔄 环境头优先 | ✅ | 4个 |
| app.theplaud.com/dashboard | 灰度发布场景模拟 - 从10%逐步扩大到100% | consistent_user | - | 10%→100% | 渐进式命中 | 📈 渐进式发布 | ✅ | 10个 |

### 📁 online.worker.test.ts

#### Online Worker › handleOnlineRequest

- ✅ **should handle successful request** (2 assertions)
- ✅ **should handle HTTP errors** (1 assertions)
- ✅ **should handle network errors** (1 assertions)
- ✅ **should pass request options** (1 assertions)

#### Online Worker › handleBatchRequests

- ✅ **should handle multiple requests** (3 assertions)



## 📁 项目结构

```
apps/web-worker/
├── src/
│   ├── offline.worker.js          # 核心 Worker 逻辑
│   ├── online.worker.js           # 在线 Worker 逻辑
│   └── index.ts                   # 入口文件
├── tests/
│   ├── routing-logic.test.ts      # 路由逻辑测试
│   ├── online.worker.test.ts      # 在线功能测试
│   └── test-utils.js              # 测试工具函数
├── scripts/
│   └── generate-test-report.ts    # 测试报告生成器
└── reports/
    └── latest-test-report.md      # 最新测试报告
```

## 🔧 核心功能

### 🎯 路由逻辑
- **灰度发布**: 基于用户标识的哈希值进行流量分配
- **环境路由**: 支持通过 header 指定目标环境
- **域名映射**: 自动将域名映射到对应的 Pages 部署
- **白名单机制**: 特定域名不做路由处理，保持原样

### 🧪 测试覆盖
- 哈希算法一致性测试
- Cookie 解析功能测试
- 域名构建逻辑测试
- 完整路由流程测试
- 灰度发布场景测试
- 环境头优先级测试
- 白名单域名测试

---

*报告生成时间: 2025/09/20 12:23:27*
*测试框架: Jest | 项目: web-worker*
