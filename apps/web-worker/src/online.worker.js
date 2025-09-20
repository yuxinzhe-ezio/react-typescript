// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接复制到 cloudflare-worker-online.js 中替换对应部分
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
  // 在线环境固定劫持 beta.plaud.ai/*，统一映射到新版本域名
  return 'https://plaud-web3.pages.dev';
}

/**
 * 🎯 核心路由逻辑 - 处理灰度发布和域名转发（在线版本）
 * @param {Object} params - 参数对象
 * @param {URL} params.inUrl - URL 对象
 * @param {string} params.cookieHeader - Cookie 头信息
 * @param {number} params.grayPercentage - 灰度百分比
 * @param {string} params.alwaysOldRoutes - 总是使用旧版本的路由
 * @returns {string} 返回目标主机名
 */
function processRouting({ inUrl, cookieHeader, grayPercentage, alwaysOldRoutes }) {
  const host = inUrl.hostname;
  const path = inUrl.pathname;

  const cookies = parseCookies(cookieHeader || '');
  const clientTag = cookies['x-pld-tag'];
  const GRAY_PERCENTAGE = grayPercentage !== undefined ? parseInt(grayPercentage) : 100; // 在线默认100%灰度（升级）
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

  if (oldRoutes.some(r => path.startsWith(r))) {
    targetHostname = 'plaud-web-dist.pages.dev'; // 在线旧版本资源
  } else if (useNewVersion) {
    targetHostname = 'plaud-web3.pages.dev'; // 在线环境新版本使用新域名
  } else {
    targetHostname = 'plaud-web-dist.pages.dev'; // 在线默认旧版本资源
  }

  return targetHostname;
}

// =================================================================
// === 核心路由逻辑结束 ===
// 以上部分可以直接复制到 cloudflare-worker-online.js 中替换对应部分
// =================================================================

// 以下 export 仅用于测试，部署时不需要
export { hashStringToPercentage, parseCookies, buildNewPagesOrigin, processRouting };
