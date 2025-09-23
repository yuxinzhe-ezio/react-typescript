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

// 以下 export 仅用于测试，部署时不需要
export { hashStringToPercentage, parseCookies, buildNewPagesOrigin, processRouting };
