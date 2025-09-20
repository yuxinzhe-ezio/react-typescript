// 测试工具函数 - 用于测试 offline.worker.js 中的逻辑

import {
  hashStringToPercentage,
  parseCookies,
  buildNewPagesOrigin,
  processRouting,
} from '../src/shared-logic.js';

// 路由测试选项类型
interface RoutingTestOptions {
  cookieHeader?: string;
  headerEnv?: string;
  grayPercentage?: number;
  alwaysOldRoutes?: string;
}

// 路由测试结果类型
interface RoutingTestResult {
  targetUrl: string;
  targetHostname: string;
  useNewVersion: boolean;
  clientTag: string | undefined;
  hash: number | null;
  grayPercentage: number;
  oldRoutes: string[];
  originalHost: string;
  originalUrl: string;
  path: string;
}

// Cookie 对象类型
interface CookieObject {
  [key: string]: string;
}

// 现在直接使用从 offline.worker.js 导入的函数

// 模拟完整路由测试的便捷函数
function testRouting(url: string, options: RoutingTestOptions = {}): RoutingTestResult {
  const inUrl = new URL(url);
  const originalUrl = url;
  const host = inUrl.hostname;
  const path = inUrl.pathname;

  const { cookieHeader, headerEnv, grayPercentage, alwaysOldRoutes } = options;

  const targetHostname = processRouting({
    inUrl,
    cookieHeader: cookieHeader || '',
    headerEnv: headerEnv || '',
    grayPercentage: grayPercentage !== undefined ? grayPercentage : 100,
    alwaysOldRoutes: alwaysOldRoutes || '',
  });

  // 更新 URL 的主机名
  inUrl.hostname = targetHostname;
  const targetUrl = inUrl.toString();

  const cookies = parseCookies(cookieHeader || '') as CookieObject;
  const clientTag = cookies['x-pld-tag'];
  const GRAY_PERCENTAGE = grayPercentage !== undefined ? parseInt(grayPercentage.toString()) : 100;
  const oldRoutes = (alwaysOldRoutes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    targetUrl: targetUrl,
    targetHostname: targetHostname,
    useNewVersion: clientTag ? hashStringToPercentage(clientTag) < GRAY_PERCENTAGE : true,
    clientTag: clientTag || undefined,
    hash: clientTag ? hashStringToPercentage(clientTag) : null,
    grayPercentage: GRAY_PERCENTAGE,
    oldRoutes: oldRoutes,
    originalHost: host,
    originalUrl: originalUrl,
    path: path,
  };
}

// ES 模块导出
export {
  hashStringToPercentage,
  parseCookies,
  buildNewPagesOrigin,
  testRouting,
  type RoutingTestOptions,
  type RoutingTestResult,
  type CookieObject,
};
