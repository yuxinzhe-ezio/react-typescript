// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接复制到 cloudflare-worker-online.js 中替换对应部分
// =================================================================

/**
 * 🎯 项目配置 - 支持多项目路由规则（在线环境）
 * 添加新项目时只需要在这里配置即可
 */
const PROJECT_CONFIG = {
  // h5 项目配置（优先匹配）
  h5: {
    domains: ['h5.theplaud.com'],
    newVersionTemplate: '{env}-h5.plaud-h5-web3.pages.dev',
    oldVersionDomain: 'prod-h5.plaud-h5-web3.pages.dev',
    defaultNewDomain: 'prod-h5.plaud-h5-web3.pages.dev',
  },
  // 主项目配置（匹配 beta.plaud.ai 和所有 theplaud.com 域名）
  web: {
    // 匹配规则：支持多个域名模式
    domainPatterns: ['beta.plaud.ai', '*.theplaud.com'],
    // 新版本域名模板：{env} 会被替换为环境名
    newVersionTemplate: '{env}.plaud-web3.pages.dev',
    // 旧版本域名
    oldVersionDomain: 'plaud-web-dist.pages.dev',
    // 默认新版本域名（无环境时）
    defaultNewDomain: 'plaud-web3.pages.dev',
  },
};

/**
 * 根据域名获取项目配置，如果找不到匹配项则兜底到 web 项目
 * @param {string} hostname - 域名
 * @returns {Object} 项目配置对象（总是返回配置，不会返回 null）
 */
function getProjectConfig(hostname) {
  for (const [projectName, config] of Object.entries(PROJECT_CONFIG)) {
    // 精确域名匹配（优先级高）
    if (config.domains) {
      const domains = Array.isArray(config.domains) ? config.domains : [config.domains];
      if (domains.includes(hostname)) {
        return { ...config, projectName };
      }
    }

    // 域名模式匹配（通配符支持）
    if (config.domainPattern) {
      const pattern = config.domainPattern.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(hostname)) {
        return { ...config, projectName };
      }
    }

    // 多域名模式匹配（支持数组）
    if (config.domainPatterns) {
      for (const domainPattern of config.domainPatterns) {
        if (domainPattern.includes('*')) {
          // 通配符模式
          const pattern = domainPattern.replace('*', '.*');
          const regex = new RegExp(`^${pattern}$`);
          if (regex.test(hostname)) {
            return { ...config, projectName };
          }
        } else {
          // 精确匹配
          if (hostname === domainPattern) {
            return { ...config, projectName };
          }
        }
      }
    }
  }

  // 兜底：返回 web 项目配置
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

function buildNewPagesOrigin(hostname) {
  // 获取项目配置（总是有返回值，兜底到 web 项目）
  const projectConfig = getProjectConfig(hostname);
  const domain = projectConfig.defaultDomain || projectConfig.defaultNewDomain;
  return `https://${domain}`;
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

  // 获取项目配置（总是有返回值，兜底到 web 项目）
  const projectConfig = getProjectConfig(host);

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
    // 强制使用旧版本的路由：根据项目配置选择旧版本域名
    targetHostname =
      projectConfig.oldVersionDomain ||
      projectConfig.defaultDomain ||
      projectConfig.defaultNewDomain;
  } else if (useNewVersion) {
    // 使用新版本：通过 buildNewPagesOrigin 处理
    targetHostname = buildNewPagesOrigin(host).replace('https://', '');
  } else {
    // 灰度控制使用旧版本：根据项目配置选择旧版本域名
    targetHostname =
      projectConfig.oldVersionDomain ||
      projectConfig.defaultDomain ||
      projectConfig.defaultNewDomain;
  }

  return targetHostname;
}

// =================================================================
// === 核心路由逻辑结束 ===
// 以上部分可以直接复制到 cloudflare-worker-online.js 中替换对应部分
// =================================================================

// 以下 export 仅用于测试，部署时不需要
export { hashStringToPercentage, parseCookies, buildNewPagesOrigin, processRouting };
