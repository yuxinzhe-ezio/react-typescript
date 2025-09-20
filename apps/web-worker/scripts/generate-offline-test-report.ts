#!/usr/bin/env tsx
// 测试报告生成器 - 将 Jest 测试结果转换为 Markdown 报告

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

function generateTestReport(): void {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 直接运行测试并获取结果
  let testResults: JestTestResult | null = null;
  try {
    console.warn('🧪 运行测试...');
    const output = execSync('pnpm test --verbose --json', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    // 提取 JSON 部分（最后一行）
    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    testResults = JSON.parse(jsonLine) as JestTestResult;
    console.warn('✅ 测试完成');
  } catch (error) {
    console.error('无法运行或解析测试结果:', (error as Error).message);
    return;
  }

  // 生成 Markdown 报告
  const report = `# 🧪 Cloudflare Worker 离线环境测试报告 (Offline)

## 📊 测试概览

**测试时间**: ${timestamp}
**测试环境**: 离线环境 (theplaud.com)
**测试文件**: 所有测试文件
**总测试数**: ${testResults.numTotalTests}
**通过**: ${testResults.numPassedTests} ✅
**失败**: ${testResults.numFailedTests} ❌
**跳过**: ${testResults.numPendingTests} ⏭️
**成功率**: ${((testResults.numPassedTests / testResults.numTotalTests) * 100).toFixed(1)}%

## 🎯 测试状态

${testResults.success ? '🎉 **所有测试通过！**' : '⚠️ **存在测试失败**'}

## 📋 详细结果

${generateDetailedResults(testResults)}

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
    ├── offline-test-report.md               # 离线测试报告
    └── online-test-report.md                # 在线测试报告
\`\`\`

## 🔧 离线环境特性

### 🎯 路由逻辑
- **灰度发布**: 基于用户标识的哈希值进行流量分配
- **环境路由**: 支持通过 x-pld-env header 指定目标环境
- **域名映射**: theplaud.com -> plaud-web3.pages.dev (新版本) / plaud-web-dist.pages.dev (旧版本)
- **白名单机制**: api.theplaud.com, www.theplaud.com, theplaud.com 不做路由处理

### 🧪 测试覆盖
- 哈希算法一致性测试
- Cookie 解析功能测试
- 域名构建逻辑测试
- 完整路由流程测试
- 灰度发布场景测试
- 环境头优先级测试
- 白名单域名测试

---

*报告生成时间: ${timestamp}*
*测试框架: Jest | 环境: 离线 (theplaud.com)*
`;

  // 确保 reports 目录存在
  const reportsDir = 'reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 生成离线环境测试报告文件
  const offlineReportPath = path.join(reportsDir, 'offline-test-report.md');

  // 写入离线报告文件
  fs.writeFileSync(offlineReportPath, report, 'utf8');

  console.log(`✅ 离线环境测试报告已生成:`);
  console.log(`   📄 离线报告: ${offlineReportPath}`);
}

function generateDetailedResults(testResults: JestTestResult): string {
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

    // 对 routing-logic.test.ts 文件，先处理基础功能测试，再处理路由测试
    if (fileName === 'routing-logic.test.ts') {
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

        // 对于路由测试，按是否有访问地址分组
        const testsWithUrl: Array<{
          test: { title: string; status: string; numPassingAsserts: number };
          status: string;
          assertions: string;
        }> = [];
        const testsWithoutUrl: Array<{
          test: { title: string; status: string; numPassingAsserts: number };
          status: string;
          assertions: string;
        }> = [];

        tests.forEach(test => {
          const status = test.status === 'passed' ? '✅' : '❌';
          const assertions = `${test.numPassingAsserts}个`;

          // 判断是否有具体的访问地址
          const hasSpecificUrl =
            test.title.includes('app.') ||
            test.title.includes('api.') ||
            test.title.includes('test.') ||
            test.title.includes('www.') ||
            test.title.includes('theplaud.com') ||
            test.title.includes('plaud.com') ||
            // 这些测试虽然标题中没有直接包含域名，但实际测试中有具体的访问地址
            test.title.includes('低哈希用户应该路由到新版本') ||
            test.title.includes('高哈希用户应该路由到旧版本') ||
            test.title.includes('旧路由应该强制使用旧版本') ||
            test.title.includes('环境头应该优先于其他逻辑') ||
            test.title.includes('没有客户端标签应该默认旧版本') ||
            test.title.includes('100% 灰度应该所有用户都是新版本') ||
            test.title.includes('0% 灰度应该所有用户都是旧版本') ||
            test.title.includes('应该正确处理复杂的 URL') ||
            test.title.includes('应该返回完整的调试信息');

          if (hasSpecificUrl) {
            testsWithUrl.push({ test, status, assertions });
          } else {
            testsWithoutUrl.push({ test, status, assertions });
          }
        });

        // 显示所有路由测试（合并有访问地址和无访问地址的测试）
        if (testsWithUrl.length > 0 || testsWithoutUrl.length > 0) {
          details += `| 访问地址 | 测试场景 | 用户标识 | x-pld-env | 灰度% | 结果地址 | 命中灰度 | 状态 | 断言 |\n`;
          details += `|----------|---------|----------|-----------|-------|----------|----------|------|---------|\n`;

          // 处理所有测试，包括有访问地址和无访问地址的
          const allTests = [...testsWithUrl, ...testsWithoutUrl];

          allTests.forEach(({ test, status, assertions }) => {
            // 解析测试用例信息，提取具体的测试参数
            let accessUrl = '-';
            let userTag = '-';
            let envHeader = '-';
            let grayPercentage = '-';
            let resultUrl = '-';
            let grayHit = '-';

            // 根据测试标题解析具体参数
            if (test.title.includes('低哈希用户应该路由到新版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user789';
              grayPercentage = '50%';
              resultUrl = 'app.plaud-web3.pages.dev';
              grayHit = '✅ 命中 (15% < 50%)';
            } else if (test.title.includes('高哈希用户应该路由到旧版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              grayPercentage = '50%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (73% > 50%)';
            } else if (test.title.includes('环境头应该优先于其他逻辑')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              envHeader = 'staging';
              grayPercentage = '0%';
              resultUrl = 'staging.plaud-web3.pages.dev';
              grayHit = '🔄 环境头优先';
            } else if (test.title.includes('没有客户端标签应该默认旧版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = '无';
              grayPercentage = '50%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 默认旧版本';
            } else if (test.title.includes('100% 灰度应该所有用户都是新版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              grayPercentage = '100%';
              resultUrl = 'app.plaud-web3.pages.dev';
              grayHit = '✅ 命中 (73% < 100%)';
            } else if (test.title.includes('0% 灰度应该所有用户都是旧版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user789';
              grayPercentage = '0%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (15% > 0%)';
            } else if (test.title.includes('30% 灰度 - 低哈希用户命中新版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user789';
              grayPercentage = '30%';
              resultUrl = 'app.plaud-web3.pages.dev';
              grayHit = '✅ 命中 (15% < 30%)';
            } else if (test.title.includes('30% 灰度 - 高哈希用户不命中灰度使用旧版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              grayPercentage = '30%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (73% > 30%)';
            } else if (test.title.includes('80% 灰度 - 中等哈希用户命中新版本')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user456';
              grayPercentage = '80%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (94% > 80%)';
            } else if (test.title.includes('环境头优先级测试')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              envHeader = 'dev';
              grayPercentage = '50%';
              resultUrl = 'dev.plaud-web3.pages.dev';
              grayHit = '🔄 环境头优先';
            } else if (test.title.includes('白名单域名测试')) {
              if (test.title.includes('api.theplaud.com')) {
                accessUrl = 'api.theplaud.com/v1/users';
                userTag = 'user789';
                resultUrl = 'api.theplaud.com';
                grayHit = '⚪ 白名单域名';
              } else if (test.title.includes('www.theplaud.com')) {
                accessUrl = 'www.theplaud.com/about';
                userTag = 'user123';
                resultUrl = 'www.theplaud.com';
                grayHit = '⚪ 白名单域名';
              } else if (test.title.includes('环境头对白名单域名无效')) {
                accessUrl = 'api.theplaud.com/v1/users';
                userTag = 'user789';
                envHeader = 'staging (无效)';
                resultUrl = 'api.theplaud.com';
                grayHit = '⚪ 白名单域名';
              }
            } else if (test.title.includes('灰度与环境头的优先级')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user123';
              envHeader = 'staging';
              grayPercentage = '20%';
              resultUrl = 'staging.plaud-web3.pages.dev';
              grayHit = '🔄 环境头优先';
            } else if (test.title.includes('访问') && test.title.includes('theplaud.com')) {
              // 处理具体访问地址的测试
              if (test.title.includes('test.theplaud.com')) {
                if (test.title.includes('x-pld-env: test3')) {
                  accessUrl = 'test.theplaud.com/api';
                  userTag = 'user123';
                  envHeader = 'test3';
                  grayPercentage = '50%';
                  resultUrl = 'test3.plaud-web3.pages.dev';
                  grayHit = '🔄 环境头优先';
                } else if (test.title.includes('高哈希用户访问')) {
                  accessUrl = 'test.theplaud.com/dashboard';
                  userTag = 'user123';
                  grayPercentage = '50%';
                  resultUrl = 'test.plaud-web-dist.pages.dev';
                  grayHit = '❌ 未命中 (73% > 50%)';
                } else {
                  accessUrl = 'test.theplaud.com/dashboard';
                  userTag = 'user789';
                  grayPercentage = '50%';
                  resultUrl = 'test.plaud-web3.pages.dev';
                  grayHit = '✅ 命中 (15% < 50%)';
                }
              } else if (test.title.includes('app.theplaud.com')) {
                accessUrl = 'app.theplaud.com/profile';
                userTag = 'user789';
                grayPercentage = '50%';
                resultUrl = 'app.plaud-web3.pages.dev';
                grayHit = '✅ 命中 (15% < 50%)';
              } else if (test.title.includes('api.theplaud.com')) {
                accessUrl = 'api.theplaud.com/v1/users';
                userTag = 'user456';
                envHeader = 'staging (无效)';
                grayPercentage = '50%';
                resultUrl = 'api.theplaud.com';
                grayHit = '⚪ 白名单域名';
              } else if (test.title.includes('www.theplaud.com')) {
                accessUrl = 'www.theplaud.com/about';
                userTag = '无';
                envHeader = 'prod (无效)';
                grayPercentage = '50%';
                resultUrl = 'www.theplaud.com';
                grayHit = '⚪ 白名单域名';
              } else if (test.title.includes('根域名 theplaud.com')) {
                accessUrl = 'theplaud.com/home';
                userTag = 'user789';
                grayPercentage = '50%';
                resultUrl = 'theplaud.com';
                grayHit = '⚪ 白名单域名';
              }
            } else if (test.title.includes('旧路由应该强制使用旧版本')) {
              accessUrl = 'admin.theplaud.com/legacy/users';
              userTag = 'user789';
              grayPercentage = '50%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '强制旧版本 (/legacy)';
            } else if (test.title.includes('应该正确处理复杂的 URL')) {
              accessUrl = 'admin.theplaud.com/v1/users?id=123&type=admin';
              userTag = 'admin';
              grayPercentage = '50%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (51% > 50%)';
            } else if (test.title.includes('应该返回完整的调试信息')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'testuser';
              grayPercentage = '30%';
              resultUrl = 'test.plaud-web-dist.pages.dev';
              grayHit = '❌ 未命中 (75% > 30%)';
            } else if (test.title.includes('复杂子域名测试')) {
              accessUrl = 'admin.api.theplaud.com';
              userTag = 'admin';
              grayPercentage = '100%';
              resultUrl = 'test.plaud-web3.pages.dev';
              grayHit = '✅ 命中 (51% < 100%)';
            } else if (test.title.includes('带查询参数的URL')) {
              accessUrl = 'app.theplaud.com/dashboard?id=123';
              userTag = 'user789';
              envHeader = 'test3';
              grayPercentage = '50%';
              resultUrl = 'test3.plaud-web3.pages.dev';
              grayHit = '🔄 环境头优先';
            } else if (test.title.includes('50% 灰度边界测试')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'boundary50';
              grayPercentage = '50%';
              resultUrl = '基于哈希值';
              grayHit = '🎯 边界测试';
            } else if (test.title.includes('不同用户在相同灰度下的分布测试')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'user_a~e';
              grayPercentage = '60%';
              resultUrl = '新/旧版本分布';
              grayHit = '📊 分布测试';
            } else if (test.title.includes('灰度发布场景模拟')) {
              accessUrl = 'app.theplaud.com/dashboard';
              userTag = 'consistent_user';
              grayPercentage = '10%→100%';
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
}

// 运行报告生成
if (require.main === module) {
  generateTestReport();
}

export { generateTestReport };
