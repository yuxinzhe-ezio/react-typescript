// Cloudflare Worker 核心路由逻辑
// 复制此文件内容到 Cloudflare Workers，并添加 export default { async fetch(request, env) { ... } }

export function hashStringToPercentage(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, value] = pair.split('=').map(v => v?.trim());
    if (key && value) {
      cookies[key] = value;
    }
  });
  return cookies;
}

export function buildNewPagesOrigin(hostname) {
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

export function processRouting({
  inUrl,
  cookieHeader,
  headerEnv,
  grayPercentage,
  alwaysOldRoutes,
}) {
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

  let useNewVersion = false; // 默认使用旧版本
  if (clientTag) {
    const hash = hashStringToPercentage(clientTag);
    useNewVersion = hash < GRAY_PERCENTAGE;
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
