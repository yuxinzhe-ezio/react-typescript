// 🎯 Cloudflare Worker 部署版本 - 直接复制此文件内容到 Cloudflare Workers

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
  const parts = hostname.split('.');
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

  const cookies = parseCookies(cookieHeader || '');
  const clientTag = cookies['x-pld-tag'];
  const GRAY_PERCENTAGE = grayPercentage !== undefined ? parseInt(grayPercentage) : 100;
  const oldRoutes = (alwaysOldRoutes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let useNewVersion = true;
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

export default {
  async fetch(request, env) {
    const inUrl = new URL(request.url);
    const cookieHeader = request.headers.get('cookie') || '';
    const headerEnv = request.headers.get('x-pld-env');

    const targetHostname = processRouting({
      inUrl,
      cookieHeader,
      headerEnv,
      grayPercentage: env.GRAY_PERCENTAGE,
      alwaysOldRoutes: env.ALWAYS_OLD_ROUTES,
    });

    inUrl.hostname = targetHostname;
    const targetUrl = inUrl.toString();

    console.log('Original URL:', request.url);
    console.log('Target URL:', targetUrl);

    const outbound = new Request(targetUrl, request);
    const response = await fetch(outbound);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};
