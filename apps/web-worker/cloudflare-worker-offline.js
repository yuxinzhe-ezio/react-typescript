// 🎯 Cloudflare Worker 完整版本 - 直接复制此文件内容到 Cloudflare Workers
//
// 使用说明：
// 1. 核心路由逻辑部分（processRouting 及其依赖函数）可以从 offline.worker.js 复制替换
// 2. export default { fetch } 部分保持不变，无需修改
// 3. 每次更新只需要替换 "=== 核心路由逻辑开始 ===" 到 "=== 核心路由逻辑结束 ===" 之间的代码

// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接复制到 cloudflare-worker-offline.js 中替换对应部分
// =================================================================

// 白名单：这些域名不做路由处理
const WHITELIST = ['api.theplaud.com', 'www.theplaud.com', 'theplaud.com'];

/**
 * 🎯 项目配置 - 支持多项目路由规则
 */
const PROJECT_CONFIG = {
  h5: {
    domains: ['h5.theplaud.com'],
    defaultDomain: 'test-h5.plaud-h5-web3.pages.dev',
    envTemplate: '{env}-h5.plaud-h5-web3.pages.dev',
  },
  web: {
    domainPattern: '*.theplaud.com',
    newVersionTemplate: '{env}.plaud-web3.pages.dev',
    oldVersionDomain: 'test.plaud-web-dist.pages.dev',
    defaultNewDomain: 'test.plaud-web3.pages.dev',
  },
};

function getProjectConfig(hostname) {
  // h5 项目优先匹配
  if (hostname === 'h5.theplaud.com') {
    return { ...PROJECT_CONFIG.h5, projectName: 'h5' };
  }
  // 其他 theplaud.com 域名都匹配到 web 项目
  return { ...PROJECT_CONFIG.web, projectName: 'web' };
}

function hashStringToPercentage(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, value] = pair.split('=').map(v => v?.trim());
    if (key && value) {
      cookies[key] = value;
    }
  });
  return cookies;
}

// 获取域名的辅助函数
function getDomain(config, isOld = false) {
  return isOld
    ? config.oldVersionDomain || config.defaultDomain || config.defaultNewDomain
    : config.defaultDomain || config.defaultNewDomain;
}

function buildNewPagesOrigin(hostname) {
  if (WHITELIST.includes(hostname)) return `https://${hostname}`;

  const config = getProjectConfig(hostname);
  const parts = hostname.split('.');

  // h5 项目直接使用默认域名
  if (config.projectName === 'h5') {
    return `https://${getDomain(config)}`;
  }

  // web 项目：保持子域名映射，使用原有格式
  if (parts.length === 3 && hostname.includes('theplaud.com')) {
    const [sub] = parts;
    return `https://${sub}.plaud-web3.pages.dev`;
  }

  // 兜底使用默认域名
  return `https://${getDomain(config)}`;
}

function processRouting({ inUrl, cookieHeader, headerEnv, grayPercentage, alwaysOldRoutes }) {
  const { hostname, pathname } = inUrl;

  if (WHITELIST.includes(hostname)) return hostname;

  const config = getProjectConfig(hostname);
  const clientTag = parseCookies(cookieHeader)['x-pld-tag'];
  const grayPercent = grayPercentage !== undefined ? parseInt(grayPercentage) : 100;
  const oldRoutes = (alwaysOldRoutes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // 判断是否使用新版本
  const useNewVersion = !clientTag || hashStringToPercentage(clientTag) < grayPercent;

  // 环境分流优先
  if (headerEnv) {
    const template = config.envTemplate || config.newVersionTemplate;
    return template ? template.replace('{env}', headerEnv) : getDomain(config);
  }

  // 强制旧版本路由
  if (oldRoutes.some(r => pathname.startsWith(r))) {
    return getDomain(config, true);
  }

  // 新版本 vs 旧版本
  if (useNewVersion) {
    return buildNewPagesOrigin(hostname).replace('https://', '');
  } else {
    return getDomain(config, true);
  }
}

// =================================================================
// === 核心路由逻辑结束 ===
// 以上部分可以直接复制到 cloudflare-worker-offline.js 中替换对应部分
// =================================================================

// =================================================================
// === Cloudflare Worker 入口点 - 此部分保持不变 ===
// =================================================================

export default {
  async fetch(request, env) {
    try {
      const inUrl = new URL(request.url);
      const cookieHeader = request.headers.get('cookie') || '';
      const headerEnv = request.headers.get('x-pld-env');

      // 调用核心路由逻辑
      const targetHostname = processRouting({
        inUrl,
        cookieHeader,
        headerEnv,
        grayPercentage: env.GRAY_PERCENTAGE,
        alwaysOldRoutes: env.ALWAYS_OLD_ROUTES,
      });

      // 构建目标 URL
      inUrl.hostname = targetHostname;
      const targetUrl = inUrl.toString();

      // 日志记录（可选，生产环境可以移除）
      console.log('🔄 Routing:', {
        original: request.url,
        target: targetUrl,
        clientTag: parseCookies(cookieHeader)['x-pld-tag'],
        env: headerEnv,
        grayPercentage: env.GRAY_PERCENTAGE,
      });

      // 创建新的请求并转发
      const outbound = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // 获取响应
      const response = await fetch(outbound);

      // 返回响应，保持原有的状态和头信息
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      // 错误处理：只记录日志，正常返回原请求的结果
      console.error('❌ Worker Error:', error);

      try {
        // 出现错误时，直接转发原始请求
        const response = await fetch(request);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (fallbackError) {
        // 如果连原始请求都失败，记录日志并返回错误响应
        console.error('❌ Fallback Error:', fallbackError);
        return new Response('Service Unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }
  },
};
