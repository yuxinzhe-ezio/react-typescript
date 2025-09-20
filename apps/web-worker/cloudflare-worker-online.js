// 🎯 Cloudflare Worker 完整版本 - 线上环境 (beta.plaud.ai)
//
// 使用说明：
// 1. 核心路由逻辑部分（processRouting 及其依赖函数）可以从 online.worker.js 复制替换
// 2. export default { fetch } 部分保持不变，无需修改
// 3. 每次更新只需要替换 "=== 核心路由逻辑开始 ===" 到 "=== 核心路由逻辑结束 ===" 之间的代码
// 4. 线上版本默认资源指向 plaud-web.pages.dev（旧版本）

// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接从 online.worker.js 复制替换
// =================================================================

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

function buildNewPagesOrigin(hostname) {
  // 白名单：这些域名不做路由处理，直接返回原域名
  const whitelist = ['api.plaud.ai', 'www.plaud.ai', 'plaud.ai'];
  if (whitelist.includes(hostname)) {
    return `https://${hostname}`;
  }

  const parts = hostname.split('.');

  // 处理 plaud.ai 域名
  if (hostname.includes('plaud.ai')) {
    if (parts.length === 3) {
      // 子域名：beta.plaud.ai -> beta.plaud-web.pages.dev
      const [sub] = parts;
      return `https://${sub}.plaud-web.pages.dev`;
    } else if (parts.length === 2) {
      // 根域名：plaud.ai -> plaud-web.pages.dev (兜底)
      return 'https://plaud-web.pages.dev';
    }
    // 复杂子域名 (>3 parts)：admin.api.plaud.ai -> plaud-web.pages.dev (兜底)
    return 'https://plaud-web.pages.dev';
  }

  // 原有逻辑保持不变
  if (parts.length === 3) {
    const [sub] = parts;
    return `https://${sub}.plaud-web.pages.dev`;
  }
  return 'https://plaud-web.pages.dev';
}

/**
 * 🎯 核心路由逻辑 - 处理灰度发布和域名转发（线上版本）
 * @param {Object} params - 参数对象
 * @param {URL} params.inUrl - URL 对象
 * @param {string} params.cookieHeader - Cookie 头信息
 * @param {string} params.headerEnv - x-pld-env 头信息
 * @param {number} params.grayPercentage - 灰度百分比
 * @param {string} params.alwaysOldRoutes - 总是使用旧版本的路由
 * @returns {string} 返回目标主机名
 */
function processRouting({ inUrl, cookieHeader, headerEnv, grayPercentage, alwaysOldRoutes }) {
  const host = inUrl.hostname;
  const path = inUrl.pathname;

  // 白名单：这些域名不做路由处理，直接返回原域名
  const whitelist = ['api.plaud.ai', 'www.plaud.ai', 'plaud.ai'];
  if (whitelist.includes(host)) {
    return host;
  }

  const cookies = parseCookies(cookieHeader || '');
  const clientTag = cookies['x-pld-tag'];
  const GRAY_PERCENTAGE = grayPercentage !== undefined ? parseInt(grayPercentage) : 0; // 线上默认0%灰度
  const oldRoutes = (alwaysOldRoutes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let useNewVersion = false; // 默认使用旧版本
  if (clientTag) {
    const hash = hashStringToPercentage(clientTag);
    useNewVersion = hash < GRAY_PERCENTAGE;
  }

  let targetHostname;

  if (headerEnv) {
    targetHostname = `${headerEnv}.plaud-web.pages.dev`;
  } else if (oldRoutes.some(r => path.startsWith(r))) {
    targetHostname = 'plaud-web.pages.dev'; // 线上旧版本资源
  } else if (useNewVersion) {
    targetHostname = buildNewPagesOrigin(host).replace('https://', '');
  } else {
    targetHostname = 'plaud-web.pages.dev'; // 线上默认旧版本资源
  }

  return targetHostname;
}

// =================================================================
// === 核心路由逻辑结束 ===
// 以上部分可以直接从 online.worker.js 复制替换
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
      console.log('🔄 Online Routing:', {
        original: request.url,
        target: targetUrl,
        clientTag: parseCookies(cookieHeader)['x-pld-tag'],
        env: headerEnv,
        grayPercentage: env.GRAY_PERCENTAGE,
        environment: 'online',
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
      // 错误处理
      console.error('❌ Online Worker Error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
