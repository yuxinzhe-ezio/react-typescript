# Web Worker - Cloudflare Workers & 灰度发布

一个专业的 Web Worker 项目，专门用于 Cloudflare Workers 部署，实现灰度发布和路由转发功能。包含完整的测试套件、部署脚本和报告生成工具。

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 快速测试功能
pnpm dev

# 运行完整单元测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试报告
pnpm run test:report
```

## 📁 项目结构

```
web-worker/
├── src/
│   ├── online.worker.js      # 🌐 在线 Worker (可直接使用)
│   ├── offline.worker.js     # 💻 离线 Worker (包含灰度发布逻辑)
│   ├── shared-logic.js       # 🔧 共享逻辑 (测试桥梁)
│   └── index.ts              # 📦 统一导出
├── tests/
│   ├── offline-routing.test.ts # 🧪 离线路由测试 (42个测试用例)
│   ├── online-routing.test.ts  # 🧪 在线路由测试
│   └── test-utils.ts          # 🛠️ 测试工具函数
├── scripts/
│   ├── test.ts               # 🔍 快速测试脚本
│   ├── generate-offline-test-report.ts # 📊 离线测试报告生成
│   └── generate-online-test-report.ts  # 📊 在线测试报告生成
├── reports/
│   ├── index.md              # 📋 测试报告索引
│   ├── offline-test-report.md # 📄 离线测试报告
│   └── online-test-report.md  # 📄 在线测试报告
├── cloudflare-worker-offline.js # ☁️ 完整的 Cloudflare Worker 代码
├── cloudflare-worker-online.js  # ☁️ 在线 Cloudflare Worker 代码
├── DEPLOYMENT.md             # 🚀 部署指南
├── jest.config.js            # ⚙️ Jest 配置
└── README.md                 # 📖 说明文档
```

## 🎯 核心功能

### 🎲 灰度发布系统

- **智能路由**: 基于用户标签的哈希算法实现灰度发布
- **环境覆盖**: 支持通过请求头强制指定环境
- **白名单机制**: 特定域名不参与灰度路由
- **动态配置**: 支持环境变量动态调整灰度百分比

### 🔧 核心函数

#### Offline Worker (灰度发布核心)

- `hashStringToPercentage`: 用户标签哈希到百分比转换
- `parseCookies`: Cookie 字符串解析
- `buildNewPagesOrigin`: 新版本页面地址构建
- `handleRouteRequest`: 灰度发布路由决策逻辑
- `processRouting`: 完整的路由处理流程

#### Online Worker (网络请求处理)

- `handleOnlineRequest`: 单个网络请求处理
- `handleBatchRequests`: 批量网络请求处理
- 完整的错误处理和重试机制

### 🌐 Cloudflare Workers 集成

- **即插即用**: 可直接复制到 Cloudflare Workers 使用
- **环境变量支持**: `GRAY_PERCENTAGE`、`ALWAYS_OLD_ROUTES`
- **性能优化**: 针对 Cloudflare Workers 运行时优化

## 🧪 测试覆盖

### 📊 测试统计

- **Offline Worker**: 42个测试用例 (灰度发布核心功能)
- **Online Worker**: 完整的网络请求测试
- **总覆盖率**: 100% 核心功能测试覆盖

### 🔍 测试分类

#### Offline Worker 测试 (42个测试用例)

- **哈希函数测试**: 一致性、范围验证、边界条件
- **Cookie 解析测试**: 各种格式、特殊字符、空值处理
- **域名构建测试**: 新版本地址构建逻辑
- **灰度路由测试**: 核心路由决策逻辑
- **环境覆盖测试**: 请求头环境强制指定
- **白名单测试**: 特定域名排除逻辑
- **边界条件测试**: 异常情况处理

#### Online Worker 测试

- ✅ 成功请求处理
- ✅ HTTP 错误处理
- ✅ 网络错误处理
- ✅ 请求选项传递
- ✅ 批量请求处理

### 📈 测试报告

- **自动生成**: 每次测试后自动生成详细报告
- **历史记录**: 保存测试历史和趋势
- **可视化**: 测试结果可视化展示

## 🔧 使用示例

### 🚀 快速开始

```bash
# 1. 快速测试所有功能
pnpm dev

# 2. 运行完整测试套件
pnpm test

# 3. 生成测试报告
pnpm run test:report
```

### 💻 开发环境使用

```typescript
// 从统一入口导入
import {
  hashStringToPercentage,
  parseCookies,
  buildNewPagesOrigin,
  processRouting,
} from './src/index.ts';

// 测试哈希函数
const userHash = hashStringToPercentage('user123'); // 73

// 解析 Cookie
const cookies = parseCookies('x-pld-tag=user123; session=abc');

// 测试路由逻辑
const routingResult = processRouting('https://app.plaud.com/dashboard', {
  cookieHeader: 'x-pld-tag=user789',
  grayPercentage: 50,
  alwaysOldRoutes: '/legacy,/admin',
});
```

### ☁️ Cloudflare Workers 部署

#### 方式一：完整部署（推荐）

```bash
# 直接复制 cloudflare-worker-offline.js 到 Cloudflare Workers 控制台
cat cloudflare-worker-offline.js | pbcopy
```

#### 方式二：核心逻辑更新

```bash
# 只更新核心路由逻辑部分
cat src/offline.worker.js | pbcopy
```

### 🌐 环境变量配置

在 Cloudflare Workers 控制台设置：

| 变量名              | 说明                   | 示例值                    | 默认值 |
| ------------------- | ---------------------- | ------------------------- | ------ |
| `GRAY_PERCENTAGE`   | 灰度发布百分比 (0-100) | `50`                      | `100`  |
| `ALWAYS_OLD_ROUTES` | 强制使用旧版本的路由   | `/legacy,/admin,/old-api` | `""`   |

### 📋 典型使用场景

```javascript
// 场景1: 50% 用户使用新版本
// 环境变量: GRAY_PERCENTAGE=50

// 场景2: 特定路由始终使用旧版本
// 环境变量: ALWAYS_OLD_ROUTES=/legacy,/admin

// 场景3: 通过请求头强制指定环境
// 请求头: x-pld-env=staging (优先级最高)

// 场景4: 白名单域名不参与路由
// api.theplaud.com, www.theplaud.com, theplaud.com
```

## 📊 测试与验证

### 🧪 测试命令

```bash
# 运行所有测试
pnpm test

# 分别运行不同测试
pnpm run test:offline    # 只运行离线测试
pnpm run test:online     # 只运行在线测试
pnpm run test:both       # 运行两个测试

# 监听模式
pnpm run test:watch      # 监听所有测试
pnpm run test:offline:watch  # 监听离线测试

# 生成测试报告
pnpm run test:report:offline  # 生成离线测试报告
pnpm run test:report:online   # 生成在线测试报告
pnpm run test:report:both     # 生成完整测试报告
```

### 📈 测试输出示例

```bash
pnpm test

# 输出示例:
# ✅ Offline Worker: 42/42 passed
# ✅ Online Worker: All tests passed
# ✅ Total: 100% test coverage
# 📊 Test report generated: reports/offline-test-report.md
```

### 🔍 测试报告

- **实时生成**: 测试完成后自动生成详细报告
- **历史追踪**: `reports/index.md` 记录所有测试历史
- **详细分析**: 每个测试用例的详细结果和执行时间

## 🎨 项目特点

### 🚀 专业级特性

- **生产就绪**: 专为 Cloudflare Workers 优化的完整解决方案
- **灰度发布**: 基于哈希算法的智能用户分流系统
- **完整测试**: 42个测试用例覆盖所有核心功能和边界条件
- **自动化报告**: 完整的测试报告生成和历史追踪系统

### 🔧 开发友好

- **即插即用**: 可直接复制到 Cloudflare Workers 使用
- **类型安全**: 完整的 TypeScript 类型定义
- **快速验证**: 一键运行测试验证所有功能
- **详细文档**: 包含部署指南和使用示例

### 📦 企业级架构

- **模块化设计**: 清晰的代码结构和职责分离
- **环境配置**: 灵活的环境变量配置系统
- **监控友好**: 完整的日志和调试信息输出
- **版本管理**: 支持灰度发布和快速回滚

## 🛠️ 开发工作流

### 📝 日常开发流程

```bash
# 1. 修改核心逻辑
vi src/offline.worker.js

# 2. 运行测试验证
pnpm test

# 3. 生成测试报告
pnpm run test:report

# 4. 更新 Cloudflare Worker
cat src/offline.worker.js | pbcopy
# 然后粘贴到 Cloudflare Workers 控制台
```

### 🔄 添加新功能

1. **开发阶段**
   - 在 `src/offline.worker.js` 中添加新函数
   - 在 `tests/offline-routing.test.ts` 中添加对应测试
   - 运行 `pnpm test` 验证功能

2. **部署阶段**
   - 更新 `cloudflare-worker-offline.js`
   - 部署到 Cloudflare Workers
   - 验证生产环境功能

### 📋 代码规范

- **函数命名**: 使用驼峰命名法，函数名清晰表达功能
- **注释规范**: 关键逻辑必须添加英文注释
- **测试覆盖**: 新功能必须包含完整的测试用例
- **错误处理**: 所有函数都要有适当的错误处理

## 🚨 故障排除

### 常见问题

#### 1. 灰度路由不生效

```bash
# 检查环境变量设置
echo "GRAY_PERCENTAGE: $GRAY_PERCENTAGE"
echo "ALWAYS_OLD_ROUTES: $ALWAYS_OLD_ROUTES"

# 验证用户哈希值
pnpm dev  # 查看测试输出中的哈希值
```

#### 2. 测试失败

```bash
# 运行特定测试
pnpm run test:offline:watch

# 查看详细错误信息
pnpm test -- --verbose
```

#### 3. 部署后功能异常

```bash
# 检查 Cloudflare Workers 日志
# 在控制台查看 "Logs" 标签页

# 本地验证功能
pnpm dev
```

### 🔄 回滚方案

如果生产环境出现问题：

1. **快速回滚**: 在 Cloudflare Workers 控制台回滚到上一版本
2. **临时关闭**: 设置 `GRAY_PERCENTAGE=0` 让所有流量走旧版本
3. **紧急修复**: 本地修复后重新部署

## 📚 相关文档

- **[部署指南](./DEPLOYMENT.md)**: 详细的 Cloudflare Workers 部署说明
- **[测试报告](./reports/index.md)**: 历史测试报告和统计信息
- **[在线测试报告](./reports/online-test-report.md)**: 在线功能测试详情
- **[离线测试报告](./reports/offline-test-report.md)**: 灰度发布功能测试详情

## 🤝 贡献指南

### 提交代码前检查清单

- [ ] 运行 `pnpm test` 确保所有测试通过
- [ ] 运行 `pnpm dev` 验证功能正常
- [ ] 添加必要的测试用例
- [ ] 更新相关文档
- [ ] 生成测试报告: `pnpm run test:report`

### 版本发布流程

1. 更新版本号
2. 运行完整测试套件
3. 生成测试报告
4. 更新 CHANGELOG
5. 部署到 Cloudflare Workers

---

**🎯 项目目标**: 为 Cloudflare Workers 提供专业的灰度发布和路由转发解决方案

**📧 技术支持**: 查看测试报告和部署文档获取更多帮助信息
