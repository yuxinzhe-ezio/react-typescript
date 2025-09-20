#!/usr/bin/env tsx
// 快速测试 Worker 功能

import type { RoutingTestOptions } from '../tests/test-utils.js';

// 路由测试用例类型
interface RoutingTest {
  name: string;
  url: string;
  options: RoutingTestOptions;
}

async function runTests() {
  // 动态导入 CommonJS 模块
  const { hashStringToPercentage, parseCookies, buildNewPagesOrigin, testRouting } = await import(
    '../tests/test-utils.js'
  );

  console.warn('=== 测试 Offline Worker 功能 ===');

  // 测试哈希函数
  console.warn('\n1. 哈希函数测试:');
  const testUsers: string[] = ['user123', 'user456', 'user789', 'admin', 'guest'];
  testUsers.forEach(user => {
    const percentage = hashStringToPercentage(user);
    console.warn(`  ${user} -> ${percentage}%`);
  });

  // 测试 Cookie 解析
  console.warn('\n2. Cookie 解析测试:');
  const cookieTests: string[] = [
    'x-pld-tag=user123; session=abc123; theme=dark',
    'single=value',
    'x-pld-tag=admin; expires=Wed, 09 Jun 2021 10:18:14 GMT',
    '',
  ];

  cookieTests.forEach(cookieHeader => {
    const cookies = parseCookies(cookieHeader);
    console.warn(`  "${cookieHeader}" -> ${JSON.stringify(cookies)}`);
  });

  // 测试域名构建
  console.warn('\n3. 域名构建测试:');
  const hostnameTests: string[] = [
    'app.plaud.com',
    'api.plaud.com',
    'plaud.com',
    'test.app.plaud.com',
  ];
  hostnameTests.forEach(hostname => {
    const origin = buildNewPagesOrigin(hostname);
    console.warn(`  ${hostname} -> ${origin}`);
  });

  // 测试路由逻辑
  console.warn('\n4. 路由逻辑测试:');
  const routingTests: RoutingTest[] = [
    {
      name: '低哈希用户 (应该获得新版本)',
      url: 'https://app.plaud.com/dashboard',
      options: {
        cookieHeader: 'x-pld-tag=user789', // hash: 15%
        grayPercentage: 50,
        alwaysOldRoutes: '',
      },
    },
    {
      name: '高哈希用户 (应该获得旧版本)',
      url: 'https://app.plaud.com/profile',
      options: {
        cookieHeader: 'x-pld-tag=user123', // hash: 73%
        grayPercentage: 50,
        alwaysOldRoutes: '',
      },
    },
    {
      name: '旧路由 (强制旧版本)',
      url: 'https://api.plaud.com/legacy/users',
      options: {
        cookieHeader: 'x-pld-tag=user789',
        grayPercentage: 50,
        alwaysOldRoutes: '/legacy,/old-api',
      },
    },
    {
      name: '环境覆盖',
      url: 'https://test.plaud.com/api',
      options: {
        cookieHeader: 'x-pld-tag=user123',
        headerEnv: 'staging',
        grayPercentage: 0,
        alwaysOldRoutes: '',
      },
    },
  ];

  routingTests.forEach(test => {
    console.warn(`\n  ${test.name}:`);
    console.warn(`    输入: ${test.url}`);

    const result = testRouting(test.url, test.options);

    console.warn(`    输出: ${result.targetUrl}`);
    console.warn(`    版本: ${result.useNewVersion ? '新' : '旧'}`);
    if (result.clientTag) {
      console.warn(`    客户端标签: ${result.clientTag} (hash: ${result.hash}%)`);
    }
  });

  console.warn('\n=== 测试完成 ===');
  console.warn('运行 `pnpm test` 执行完整的单元测试');
  console.warn('');
  console.warn('📁 可直接使用的 JavaScript 文件:');
  console.warn('  🌐 在线 Worker: src/online.worker.js');
  console.warn('  💻 离线 Worker: src/offline.worker.js (包含 Cloudflare Worker 逻辑)');
  console.warn('');
  console.warn('🎯 Cloudflare Workers: 复制 src/offline.worker.js 的内容直接使用！');
}

// 运行测试
runTests().catch(console.error);
