#!/usr/bin/env tsx
// 在线测试报告生成器 - 专门处理 beta.plaud.ai 环境的测试结果

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Jest 测试结果类型定义
interface JestTestResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  success: boolean;
  testResults: Array<{
    name: string;
    assertionResults: Array<{
      title: string;
      status: 'passed' | 'failed' | 'pending';
      numPassingAsserts: number;
      ancestorTitles?: string[];
    }>;
  }>;
}

const generateOnlineTestReport = (): void => {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 只运行在线测试
  let testResults: JestTestResult | null = null;
  try {
    console.warn('🧪 运行在线测试...');
    const output = execSync('pnpm test online-routing.test.ts --verbose --json', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    // 提取 JSON 部分（最后一行）
    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    testResults = JSON.parse(jsonLine) as JestTestResult;
    console.warn('✅ 在线测试完成');
  } catch (error) {
    console.error('无法运行或解析在线测试结果:', (error as Error).message);
    return;
  }

  // 生成 Markdown 报告
  const report = `# 🌐 Cloudflare Worker 在线环境测试报告 (Online)

## 📊 测试概览

**测试时间**: ${timestamp}
**测试环境**: 在线环境 (beta.plaud.ai)
**测试文件**: online-routing.test.ts
**总测试数**: ${testResults.numTotalTests}
**通过**: ${testResults.numPassedTests} ✅
**失败**: ${testResults.numFailedTests} ❌
**跳过**: ${testResults.numPendingTests} ⏭️
**成功率**: ${((testResults.numPassedTests / testResults.numTotalTests) * 100).toFixed(1)}%

## 🌐 在线环境配置

- **域名**: beta.plaud.ai (公测环境)
- **旧版本资源**: plaud-web-dist.pages.dev (旧项目)
- **新版本资源**: plaud-web3.pages.dev (新项目)
- **默认灰度**: 100% (升级策略)
- **劫持域名**: beta.plaud.ai (固定劫持)

## 🎯 测试状态

${testResults.success ? '🎉 **所有在线测试通过！**' : '⚠️ **存在在线测试失败**'}

## 📋 详细结果

${generateOnlineDetailedResults(testResults)}

## 📁 项目结构

\`\`\`
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
\`\`\`

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

*报告生成时间: ${timestamp}*
*测试框架: Jest | 环境: 在线 (beta.plaud.ai)*
`;

  // 确保 reports 目录存在
  const reportsDir = 'reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 生成在线测试报告文件
  const onlineReportPath = path.join(reportsDir, 'online-test-report.md');

  // 写入在线报告文件
  fs.writeFileSync(onlineReportPath, report, 'utf8');

  console.log(`✅ 在线环境测试报告已生成:`);
  console.log(`   📄 在线报告: ${onlineReportPath}`);
};

const generateOnlineDetailedResults = (testResults: JestTestResult): string => {
  if (!testResults.testResults || testResults.testResults.length === 0) {
    return '无详细测试结果';
  }

  let details = '';

  testResults.testResults.forEach(fileResult => {
    const fileName = path.basename(fileResult.name);
    details += `### 📁 ${fileName}\n\n`;

    // 按测试套件分组
    const suiteMap = new Map<
      string,
      Array<{ title: string; status: string; numPassingAsserts: number }>
    >();

    fileResult.assertionResults.forEach(test => {
      // 使用 ancestorTitles 获取测试套件层级信息
      const suiteName =
        test.ancestorTitles && test.ancestorTitles.length > 0
          ? test.ancestorTitles.join(' › ')
          : '其他测试';
      const testName = test.title;

      if (!suiteMap.has(suiteName)) {
        suiteMap.set(suiteName, []);
      }

      suiteMap.get(suiteName)!.push({
        title: testName,
        status: test.status,
        numPassingAsserts: test.numPassingAsserts,
      });
    });

    // 对 online-routing.test.ts 文件，先处理基础功能测试，再处理路由测试
    if (fileName === 'online-routing.test.ts') {
      // 分离基础功能测试和路由测试
      const basicTests = new Map();
      const routingTests = new Map();

      suiteMap.forEach((tests, suiteName) => {
        const isBasicTest =
          suiteName.includes('hashStringToPercentage') ||
          suiteName.includes('parseCookies') ||
          suiteName.includes('buildNewPagesOrigin');

        if (isBasicTest) {
          basicTests.set(suiteName, tests);
        } else {
          routingTests.set(suiteName, tests);
        }
      });

      // 先处理基础功能测试
      basicTests.forEach((tests, suiteName) => {
        // 提取方法名，去掉前缀
        const methodName = suiteName.split(' › ').pop() || suiteName;
        details += `#### ${methodName}\n\n`;
        tests.forEach(test => {
          const status = test.status === 'passed' ? '✅' : '❌';
          const assertions = `${test.numPassingAsserts}个`;
          details += `- ${status} **${test.title}** (${assertions})\n`;
        });
        details += '\n';
      });

      // 再处理路由测试
      routingTests.forEach((tests, suiteName) => {
        details += `#### ${suiteName}\n\n`;

        // 对于路由测试，使用表格格式展示
        if (tests.length > 0) {
          details += `| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |\n`;
          details += `|----------|---------|----------|-----------|-------|----------|----------|------|---------|\n`;

          tests.forEach(test => {
            const status = test.status === 'passed' ? '✅' : '❌';
            const assertions = `${test.numPassingAsserts}个`;

            // 解析在线测试用例信息
            let accessUrl = 'beta.plaud.ai/*';
            let userTag = '-'; // 默认为无用户标识
            let envHeader = '-';
            let grayPercentage = '0%';
            let resultUrl = 'plaud-web3.pages.dev';
            let grayHit = '🌐 在线环境';

            // 根据测试标题解析具体参数
            if (
              test.title.includes('在线环境默认0%灰度') ||
              test.title.includes('线上环境默认0%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user789';
              grayPercentage = '0%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (34% > 0%)';
            } else if (
              test.title.includes('在线环境10%灰度') ||
              test.title.includes('线上环境10%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user789';
              grayPercentage = '10%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (34% > 10%)';
            } else if (
              test.title.includes('在线环境40%灰度') ||
              test.title.includes('线上环境40%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user789';
              grayPercentage = '40%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 命中 (34% < 40%)';
            } else if (
              test.title.includes('在线环境5%灰度') ||
              test.title.includes('线上环境5%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'user789';
              grayPercentage = '5%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (15% > 5%)';
            } else if (
              test.title.includes('在线环境20%灰度') ||
              test.title.includes('线上环境20%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'user789';
              grayPercentage = '20%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 命中 (15% < 20%)';
            } else if (
              test.title.includes('在线环境75%灰度') ||
              test.title.includes('线上环境75%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'user123';
              grayPercentage = '75%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 命中 (73% < 75%)';
            } else if (
              test.title.includes('在线环境70%灰度') ||
              test.title.includes('线上环境70%灰度')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user123';
              grayPercentage = '70%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (76% > 70%)';
            } else if (
              test.title.includes('访问 beta.plaud.ai') &&
              !test.title.includes('没有用户标识')
            ) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user789';
              grayPercentage = '40%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 命中 (34% < 40%)';
            } else if (
              test.title.includes('访问 app.plaud.ai') &&
              !test.title.includes('没有用户标识')
            ) {
              accessUrl = 'app.plaud.ai/profile';
              userTag = 'beta_user789';
              grayPercentage = '40%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 命中 (34% < 40%)';
            } else if (test.title.includes('高哈希用户')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user123';
              grayPercentage = '50%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (76% > 50%)';
            } else if (test.title.includes('旧路由强制使用旧版本')) {
              accessUrl = 'beta.plaud.ai/legacy/admin';
              userTag = 'beta_user789';
              grayPercentage = '50%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '🔄 旧路由优先';
            } else if (test.title.includes('访问 api.plaud.ai')) {
              accessUrl = 'api.plaud.ai/v1/users';
              userTag = 'beta_user456';
              envHeader = 'staging (无效)';
              grayPercentage = '50%';
              resultUrl = 'api.plaud.ai';
              grayHit = '⚪ 白名单域名';
            } else if (test.title.includes('访问根域名 plaud.ai')) {
              accessUrl = 'plaud.ai/home';
              userTag = 'beta_user789';
              grayPercentage = '50%';
              resultUrl = 'plaud.ai';
              grayHit = '⚪ 白名单域名';
            } else if (test.title.includes('访问 www.plaud.ai')) {
              accessUrl = 'www.plaud.ai/about';
              userTag = '无';
              envHeader = 'prod (无效)';
              grayPercentage = '50%';
              resultUrl = 'www.plaud.ai';
              grayHit = '⚪ 白名单域名';
            } else if (test.title.includes('环境头应该优先于灰度逻辑')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = 'beta_user123';
              envHeader = 'staging';
              grayPercentage = '0%';
              resultUrl = 'staging.plaud-web3.pages.dev';
              grayHit = '🔄 环境头优先';
            } else if (test.title.includes('没有客户端标签应该默认新版本')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = '-';
              if (test.title.includes('50%灰度')) {
                grayPercentage = '50%';
              } else if (test.title.includes('0%灰度')) {
                grayPercentage = '0%';
              } else if (test.title.includes('100%灰度')) {
                grayPercentage = '100%';
              }
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 默认新版本';
            } else if (test.title.includes('空Cookie头应该默认新版本')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = '-';
              grayPercentage = '30%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 默认新版本';
            } else if (test.title.includes('只有其他Cookie没有x-pld-tag应该默认新版本')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = '-';
              grayPercentage = '25%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 默认新版本';
            } else if (test.title.includes('x-pld-tag为空值应该默认新版本')) {
              accessUrl = 'beta.plaud.ai/dashboard';
              userTag = '-';
              grayPercentage = '10%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 默认新版本';
            } else if (
              test.title.includes('没有用户标识访问') &&
              test.title.includes('应该返回新版本域名')
            ) {
              if (test.title.includes('beta.plaud.ai')) {
                accessUrl = 'beta.plaud.ai/dashboard';
              } else if (test.title.includes('app.plaud.ai')) {
                accessUrl = 'app.plaud.ai/profile';
              }
              userTag = '-';
              grayPercentage = test.title.includes('20%') ? '20%' : '5%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 默认新版本';
            } else if (test.title.includes('没有用户标识在各种灰度下都使用新版本')) {
              accessUrl = 'beta.plaud.ai/no-user-test';
              userTag = '-';
              grayPercentage = '0%~100%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 全灰度新版本';
            } else if (test.title.includes('没有用户标识访问旧路由应该使用旧版本')) {
              accessUrl = 'beta.plaud.ai/legacy/settings';
              userTag = '-';
              grayPercentage = '100%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '🔄 旧路由优先';
            } else if (test.title.includes('0%灰度 - 所有用户都使用旧版本')) {
              accessUrl = 'beta.plaud.ai/test';
              userTag = 'beta_user_a~c';
              grayPercentage = '0%';
              resultUrl = 'plaud-web-dist.pages.dev';
              grayHit = '❌ 全部旧版本';
            } else if (test.title.includes('100%灰度 - 所有用户都使用新版本')) {
              accessUrl = 'beta.plaud.ai/test';
              userTag = 'beta_user_x~z';
              grayPercentage = '100%';
              resultUrl = 'plaud-web3.pages.dev';
              grayHit = '✅ 全部新版本';
            } else if (
              test.title.includes('在线渐进式发布模拟') ||
              test.title.includes('线上渐进式发布模拟')
            ) {
              accessUrl = 'beta.plaud.ai/rollout';
              userTag = 'beta_consistent_user';
              grayPercentage = '0%→100%';
              resultUrl = '渐进式命中';
              grayHit = '📈 渐进式发布';
            }

            details += `| ${accessUrl} | ${test.title} | ${userTag} | ${envHeader} | ${grayPercentage} | ${resultUrl} | ${grayHit} | ${status} | ${assertions} |\n`;
          });
          details += '\n';
        }
      });
    } else {
      // 对其他文件使用普通列表格式
      suiteMap.forEach((tests, suiteName) => {
        details += `#### ${suiteName}\n\n`;
        tests.forEach(test => {
          const status = test.status === 'passed' ? '✅' : '❌';
          details += `- ${status} **${test.title}** ${test.numPassingAsserts > 0 ? `(${test.numPassingAsserts} assertions)` : ''}\n`;
        });
        details += '\n';
      });
    }
  });

  return details;
};

// 运行报告生成
if (require.main === module) {
  generateOnlineTestReport();
}

export { generateOnlineTestReport };
