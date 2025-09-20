# 🚀 Cloudflare Worker 部署指南

## 📁 文件说明

- **`cloudflare-worker-complete.js`** - 完整的 Cloudflare Worker 代码，可直接部署
- **`src/offline.worker.js`** - 核心路由逻辑，用于开发和测试
- **`DEPLOYMENT.md`** - 本部署指南

## 🔄 更新流程

### 方式一：完整替换（推荐）

直接将 `cloudflare-worker-complete.js` 的全部内容复制到 Cloudflare Workers 控制台。

### 方式二：部分更新（高效）

1. 在 Cloudflare Workers 中保持 `export default { fetch }` 部分不变
2. 只替换核心路由逻辑部分：

```javascript
// 在 cloudflare-worker-complete.js 中找到这两行注释之间的代码：
// === 核心路由逻辑开始 ===
// ... 这里的代码可以从 offline.worker.js 复制替换
// === 核心路由逻辑结束 ===
```

3. 从 `src/offline.worker.js` 复制对应部分的代码进行替换

## 📋 部署步骤

### 1. 准备代码

```bash
# 确保测试通过
pnpm test

# 生成测试报告（可选）
pnpm run test:report
```

### 2. 复制代码

- 复制 `cloudflare-worker-complete.js` 的全部内容
- 或者按照"方式二"进行部分更新

### 3. 部署到 Cloudflare Workers

1. 登录 [Cloudflare Workers 控制台](https://workers.cloudflare.com/)
2. 选择你的 Worker
3. 粘贴代码
4. 点击 "Save and Deploy"

### 4. 配置环境变量

在 Cloudflare Workers 控制台中设置以下环境变量：

| 变量名              | 说明                   | 示例值           |
| ------------------- | ---------------------- | ---------------- |
| `GRAY_PERCENTAGE`   | 灰度发布百分比 (0-100) | `50`             |
| `ALWAYS_OLD_ROUTES` | 总是使用旧版本的路由   | `/legacy,/admin` |

## 🧪 测试验证

### 本地测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test routing-logic.test.ts
```

### 线上验证

使用不同的测试场景验证部署效果：

1. **基础路由测试**

   ```bash
   curl -H "Cookie: x-pld-tag=user789" https://your-worker.your-subdomain.workers.dev/test
   ```

2. **环境头测试**

   ```bash
   curl -H "x-pld-env: staging" https://your-worker.your-subdomain.workers.dev/test
   ```

3. **白名单域名测试**
   ```bash
   curl https://api.theplaud.com/v1/test
   ```

## 🔧 开发工作流

### 日常开发

1. 在 `src/offline.worker.js` 中修改核心路由逻辑
2. 运行测试确保功能正常：`pnpm test`
3. 从 `offline.worker.js` 复制更新的代码到 Cloudflare Workers

### 添加新功能

1. 在 `src/offline.worker.js` 中添加新函数
2. 在 `tests/routing-logic.test.ts` 中添加对应测试
3. 运行测试：`pnpm test`
4. 更新 `cloudflare-worker-complete.js`
5. 部署到 Cloudflare Workers

## 📊 监控和调试

### 查看日志

在 Cloudflare Workers 控制台的 "Logs" 标签页可以查看：

- 路由转发日志
- 错误信息
- 性能指标

### 调试信息

Worker 会输出以下调试信息：

```javascript
{
  original: "https://app.theplaud.com/dashboard",
  target: "https://app.plaud-web3.pages.dev/dashboard",
  clientTag: "user789",
  env: null,
  grayPercentage: 50
}
```

## ⚠️ 注意事项

1. **环境变量**：确保在 Cloudflare Workers 中正确设置环境变量
2. **白名单域名**：`api.theplaud.com`、`www.theplaud.com`、`theplaud.com` 不会被路由转发
3. **默认行为**：没有 `x-pld-tag` cookie 时默认使用旧版本
4. **环境头优先级**：`x-pld-env` 头的优先级高于灰度逻辑

## 🚨 故障排除

### 常见问题

1. **路由不生效**
   - 检查环境变量是否正确设置
   - 确认 cookie 中的 `x-pld-tag` 值

2. **白名单域名被路由**
   - 检查域名是否在白名单中
   - 确认 `buildNewPagesOrigin` 函数逻辑

3. **环境头不生效**
   - 检查请求头中的 `x-pld-env` 值
   - 确认环境头处理逻辑

### 回滚方案

如果新版本有问题，可以：

1. 在 Cloudflare Workers 控制台中回滚到上一个版本
2. 或者临时设置 `GRAY_PERCENTAGE=0` 让所有流量走旧版本
