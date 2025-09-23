// 🎯 Cloudflare Worker 完整版本 - 在线环境 (beta.plaud.ai)
//
// 使用说明：
// 1. 核心路由逻辑部分（processRouting 及其依赖函数）可以从 online.worker.js 复制替换
// 2. export default { fetch } 部分保持不变，无需修改
// 3. 每次更新只需要替换 "=== 核心路由逻辑开始 ===" 到 "=== 核心路由逻辑结束 ===" 之间的代码

// =================================================================
// === 核心路由逻辑开始 ===
// 以下部分可以直接复制到 cloudflare-worker-online.js 中替换对应部分
// =================================================================

/**
 * 🎯 项目配置 - 支持多项目路由规则（在线环境）
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

// =================================================================
// === Cloudflare Worker 入口点 - 此部分保持不变 ===
// =================================================================

export default {
  async fetch(request, env) {
    try {
      const inUrl = new URL(request.url);
      const cookieHeader = request.headers.get('cookie') || '';

      // 调用核心路由逻辑（在线环境不支持 x-pld-env）
      const targetHostname = processRouting({
        inUrl,
        cookieHeader,
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
      console.error('❌ Online Worker Error:', error);

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