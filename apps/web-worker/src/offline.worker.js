// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接复制到 cloudflare-worker-offline.js 中替换对应部分
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
  const whitelist = ['api.theplaud.com', 'www.theplaud.com', 'theplaud.com'];
  if (whitelist.includes(hostname)) {
    return `https://${hostname}`;
  }

  const parts = hostname.split('.');

  // 处理 theplaud.com 和 plaud.com 域名
  if (hostname.includes('theplaud.com') || hostname.includes('plaud.com')) {
    if (parts.length === 3) {
      // 子域名：test.theplaud.com -> test.plaud-web3.pages.dev
      const [sub] = parts;
      return `https://${sub}.plaud-web3.pages.dev`;
    } else if (parts.length === 2) {
      // 根域名：theplaud.com -> test.plaud-web3.pages.dev (兜底)
      return 'https://test.plaud-web3.pages.dev';
    }
    // 复杂子域名 (>3 parts)：admin.api.theplaud.com -> test.plaud-web3.pages.dev (兜底)
    return 'https://test.plaud-web3.pages.dev';
  }

  // 原有逻辑保持不变
  if (parts.length === 3) {
    const [sub] = parts;
    return `https://${sub}.plaud-web3.pages.dev`;
  }
  return 'https://plaud-web3.pages.dev';
}

/**
 * 🎯 核心路由逻辑 - 处理灰度发布和域名转发
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
  const whitelist = ['api.theplaud.com', 'www.theplaud.com', 'theplaud.com'];
  if (whitelist.includes(host)) {
    return host;
  }

  const cookies = parseCookies(cookieHeader || '');
  const clientTag = cookies['x-pld-tag'];
  const GRAY_PERCENTAGE = grayPercentage !== undefined ? parseInt(grayPercentage) : 100;
  const oldRoutes = (alwaysOldRoutes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let useNewVersion = true; // 默认使用新版本（升级）
  if (clientTag) {
    const hash = hashStringToPercentage(clientTag);
    useNewVersion = hash < GRAY_PERCENTAGE;
  } else {
    // 没有客户端标签时默认使用新版本
    useNewVersion = true;
  }

  let targetHostname;

  if (headerEnv) {
    targetHostname = `${headerEnv}.plaud-web3.pages.dev`;
  } else if (oldRoutes.some(r => path.startsWith(r))) {
    targetHostname = 'test.plaud-web-dist.pages.dev';
  } else if (useNewVersion) {
    targetHostname = buildNewPagesOrigin(host).replace('https://', '');
  } else {
    targetHostname = 'test.plaud-web-dist.pages.dev';
  }

  return targetHostname;
}

// =================================================================
// === 核心路由逻辑结束 ===
// 以上部分可以直接复制到 cloudflare-worker-offline.js 中替换对应部分
// =================================================================

// 以下 export 仅用于测试，部署时不需要
export { hashStringToPercentage, parseCookies, buildNewPagesOrigin, processRouting };
