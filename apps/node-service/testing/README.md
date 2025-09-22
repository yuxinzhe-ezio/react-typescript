# Node Service 测试工具

这个目录包含了用于测试已部署 node-service 的所有工具和文档。

## 📁 文件结构

```
apps/node-service/testing/
├── README.md                    # 本文档
├── package.json                 # 测试工具配置 (已集成到主 package.json)
├── test-deployed-service.js     # 自动化测试脚本
└── node-service-api-tests.json  # Postman 测试集合
```

## 🚀 快速开始

### 方式1: 使用 npm scripts (推荐)

```bash
# 进入 node-service 目录
cd apps/node-service

# 测试本地服务 (localhost:8080)
npm run test:api:local

# 测试远程服务 (需要指定 URL)
npm run test:api http://your-server.com:8080

# 查看帮助
npm run test:api:help
```

### 方式2: 直接运行脚本

```bash
# 进入 node-service 目录
cd apps/node-service

# 测试本地服务 (默认 localhost:8080)
node testing/test-deployed-service.js

# 测试远程部署的服务
node testing/test-deployed-service.js http://your-server.com:8080

# 测试自定义接口
node testing/test-deployed-service.js http://your-server.com:8080 --custom /demo GET

# 查看帮助
node testing/test-deployed-service.js --help
```

### 2. 使用 curl 命令测试

#### 测试基础 Demo 接口

```bash
# 将 YOUR_SERVER_URL 替换为你的实际服务器地址
curl -X GET http://YOUR_SERVER_URL:8080/demo \
  -H "Content-Type: application/json"
```

预期响应：

```json
{
  "ok": true,
  "message": "Hello from Demo Service!"
}
```

#### 测试 Lark 回调接口

```bash
# 测试部署状态更新回调
curl -X POST http://YOUR_SERVER_URL:8080/lark/callback/update-deployment-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "environment": "production",
    "deploymentId": "deploy-123456",
    "message": "Deployment completed successfully",
    "region": "global",
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

### 方式3: 使用 Postman 测试

我已经创建了一个 Postman 集合文件 `node-service-api-tests.json`，你可以：

1. 打开 Postman
2. 点击 Import
3. 选择 `apps/node-service/testing/node-service-api-tests.json` 文件
4. 修改环境变量 `base_url` 为你的服务器地址
5. 运行测试集合

## 服务接口说明

### Demo 模块

- **GET /demo** - 基础健康检查接口，用于验证服务是否正常运行

### Lark 模块

- **POST /lark/callback/update-deployment-status** - 接收部署状态更新的回调接口

#### 部署状态回调参数说明：

```typescript
{
  status: 'success' | 'failed' | 'in_progress',  // 部署状态
  environment: string,                           // 环境名称 (production, staging, etc.)
  deploymentId: string,                         // 部署ID
  message: string,                              // 状态消息
  region?: 'global' | 'cn',                    // 部署区域 (可选)
  error?: string,                              // 错误信息 (失败时)
  progress?: number,                           // 进度百分比 (进行中时)
  timestamp: string                            // 时间戳
}
```

## 常见问题排查

### 1. 连接被拒绝 (Connection Refused)

- 检查服务器地址和端口是否正确
- 确认服务是否正在运行
- 检查防火墙设置

### 2. 404 Not Found

- 确认请求的路径是否正确
- 检查服务是否包含该接口

### 3. 500 Internal Server Error

- 查看服务器日志
- 检查请求参数格式是否正确

## 环境变量

服务使用以下环境变量：

- `PORT` - 服务端口 (默认: 8080)
- `GITHUB_OWNER` - GitHub 仓库所有者
- `GITHUB_REPO` - GitHub 仓库名称
- `GITHUB_TOKEN` - GitHub 访问令牌
- `GITHUB_WORKFLOW_ID` - GitHub Actions 工作流ID

## 开发建议

1. **日志监控**: 在测试时建议查看服务器日志，了解请求处理情况
2. **错误处理**: 注意观察不同错误状态码的响应内容
3. **性能测试**: 可以使用测试脚本的时间统计功能监控接口响应时间
4. **批量测试**: 使用 Postman 的 Collection Runner 进行批量接口测试

## 示例测试场景

### 场景1: 服务健康检查

```bash
# 快速检查服务是否可访问
node test-deployed-service.js http://your-server.com:8080
```

### 场景2: 模拟部署回调

```bash
# 模拟成功部署通知
curl -X POST http://your-server.com:8080/lark/callback/update-deployment-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "environment": "production",
    "deploymentId": "prod-deploy-001",
    "message": "Production deployment successful"
  }'
```

### 场景3: 压力测试

你可以修改测试脚本，添加并发请求来测试服务的负载能力。

## 🎯 快速测试命令

```bash
# 从项目根目录开始
cd apps/node-service

# 测试本地开发服务器
npm run test:api:local

# 测试生产服务器 (替换为你的实际地址)
npm run test:api https://your-production-server.com

# 或者直接使用脚本测试特定接口
node testing/test-deployed-service.js https://your-server.com --custom /demo GET
```

---

如果你遇到任何问题或需要添加新的测试用例，请随时告诉我！
