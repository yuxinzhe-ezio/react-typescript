# Web Worker - 简化版本

一个简化的 Web Worker 项目，包含 online 和 offline 两个 worker 及其完整的单元测试。

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
```

## 📁 项目结构

```
web-worker/
├── src/
│   ├── online.worker.ts      # 🌐 在线 Worker (TypeScript 版本)
│   ├── online.worker.js      # 🌐 在线 Worker (JavaScript 版本，可直接使用)
│   ├── offline.worker.ts     # 💻 离线 Worker (TypeScript 版本)
│   ├── offline.worker.js     # 💻 离线 Worker (JavaScript 版本，包含 Cloudflare Worker 逻辑)
│   └── index.ts              # 📦 统一导出
├── tests/
│   ├── online.worker.test.ts # 🧪 在线 Worker 测试
│   └── offline.worker.test.ts# 🧪 离线 Worker 测试
├── test.ts                   # 🔍 快速测试脚本
├── package.json              # 📦 依赖配置
└── README.md                 # 📖 说明文档
```

## 🎯 功能说明

### Online Worker (网络请求)
- `handleOnlineRequest`: 处理单个网络请求
- `handleBatchRequests`: 处理批量网络请求
- 完整的错误处理和类型支持

### Offline Worker (本地处理 + 路由)
- `hashStringToPercentage`: 字符串哈希到百分比
- `parseCookies`: Cookie 字符串解析
- `buildNewPagesOrigin`: 构建新页面地址
- `handleRouteRequest`: 灰度发布路由逻辑
- `processData`: 数据处理
- `calculate`: 数学计算

## 🧪 测试覆盖

### Online Worker 测试 (5个测试用例)
- ✅ 成功请求处理
- ✅ HTTP 错误处理  
- ✅ 网络错误处理
- ✅ 请求选项传递
- ✅ 批量请求处理

### Offline Worker 测试 (25个测试用例)
- ✅ 哈希函数一致性和范围
- ✅ Cookie 解析各种格式
- ✅ 域名构建逻辑
- ✅ 路由逻辑 (灰度发布核心)
- ✅ 数据处理功能
- ✅ 计算功能和错误处理

## 🔧 使用示例

### TypeScript 版本 (开发环境)

```typescript
import { 
  handleRouteRequest, 
  hashStringToPercentage,
  parseCookies 
} from './src/offline.worker';

import { handleOnlineRequest } from './src/online.worker';

// 路由请求
const result = handleRouteRequest('https://app.plaud.com/api', {
  cookieHeader: 'x-pld-tag=user123',
  grayPercentage: 50,
  alwaysOldRoutes: ['/legacy']
});

// 网络请求
const data = await handleOnlineRequest('https://api.example.com/data');
```

### JavaScript 版本 (生产环境)

#### 🌐 在线 Worker (`src/online.worker.js`)
- **Web Workers**: 直接复制文件内容使用
- **Node.js**: 支持 CommonJS 导入
- **浏览器**: 支持直接引入

#### 💻 离线 Worker (`src/offline.worker.js`)
- **Cloudflare Workers**: 直接复制整个文件内容到 Cloudflare Workers 编辑器
- **Web Workers**: 支持消息通信
- **Node.js**: 支持函数导入

```javascript
// Cloudflare Workers 使用方式
// 直接复制 src/offline.worker.js 的全部内容到 Cloudflare Workers

// 环境变量配置：
// GRAY_PERCENTAGE: 灰度发布百分比 (默认 100)
// ALWAYS_OLD_ROUTES: 总是使用旧版本的路由 (逗号分隔)
```

## 📊 测试运行

```bash
# 运行所有测试
pnpm test

# 输出示例:
# Online Worker: 5 passed
# Offline Worker: 25 passed  
# Total: 30 passed
```

## 🎨 开发特点

- **简化结构**: 只保留核心的两个 worker
- **完整测试**: 30个测试用例覆盖所有功能
- **类型安全**: 完整的 TypeScript 类型定义
- **即插即用**: 可直接复制到 Cloudflare Workers 使用
- **快速验证**: 一键运行测试验证所有功能