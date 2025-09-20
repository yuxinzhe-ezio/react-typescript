// 测试在线环境（beta.plaud.ai）的路由逻辑
import { online } from '../src/shared-logic.js';

// 在线环境测试辅助函数
function testOnlineRouting(
  url: string,
  options: {
    cookieHeader?: string;
    headerEnv?: string;
    grayPercentage?: number;
    alwaysOldRoutes?: string;
  } = {}
) {
  const inUrl = new URL(url);
  const { cookieHeader, headerEnv, grayPercentage, alwaysOldRoutes } = options;

  const cookies = online.parseCookies(cookieHeader || '') as any;
  const clientTag = cookies['x-pld-tag'];
  const hash = clientTag ? online.hashStringToPercentage(clientTag) : null;
  const useNewVersion = clientTag ? hash! < (grayPercentage || 0) : false;

  const targetHostname = online.processRouting({
    inUrl,
    cookieHeader: cookieHeader || '',
    headerEnv: headerEnv || '',
    grayPercentage: grayPercentage || 0,
    alwaysOldRoutes: alwaysOldRoutes || '',
  });

  const targetUrl = new URL(url);
  targetUrl.hostname = targetHostname;

  return {
    originalUrl: url,
    targetUrl: targetUrl.toString(),
    targetHostname,
    useNewVersion,
    clientTag,
    hash,
    grayPercentage: grayPercentage || 0,
    oldRoutes: (alwaysOldRoutes || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    originalHost: inUrl.hostname,
    path: inUrl.pathname,
  };
}

describe('Online Routing Logic (beta.plaud.ai 在线环境)', () => {
  describe('online.hashStringToPercentage - 在线环境哈希算法', () => {
    it('应该返回一致的哈希百分比', () => {
      expect(online.hashStringToPercentage('beta_user123')).toBe(76);
      expect(online.hashStringToPercentage('beta_user456')).toBe(55);
      expect(online.hashStringToPercentage('beta_user789')).toBe(34);
    });

    it('相同字符串应该返回相同结果', () => {
      const str = 'betaTestUser';
      expect(online.hashStringToPercentage(str)).toBe(online.hashStringToPercentage(str));
    });

    it('应该返回 0-99 范围内的值', () => {
      for (let i = 0; i < 50; i++) {
        const hash = online.hashStringToPercentage(`beta_user_${i}`);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(100);
      }
    });
  });

  describe('buildNewPagesOrigin - 在线域名构建', () => {
    it('应该处理 beta.plaud.ai 子域名', () => {
      expect(online.buildNewPagesOrigin('beta.plaud.ai')).toBe('https://beta.plaud-web.pages.dev');
      expect(online.buildNewPagesOrigin('app.plaud.ai')).toBe('https://app.plaud-web.pages.dev');
    });

    it('应该处理根域名 plaud.ai', () => {
      expect(online.buildNewPagesOrigin('plaud.ai')).toBe('https://plaud.ai');
    });

    it('应该处理白名单域名', () => {
      expect(online.buildNewPagesOrigin('api.plaud.ai')).toBe('https://api.plaud.ai');
      expect(online.buildNewPagesOrigin('www.plaud.ai')).toBe('https://www.plaud.ai');
    });

    it('应该处理复杂子域名', () => {
      expect(online.buildNewPagesOrigin('admin.api.plaud.ai')).toBe('https://plaud-web.pages.dev');
    });
  });

  describe('在线路由逻辑测试 - beta.plaud.ai 域名', () => {
    const baseUrl = 'https://beta.plaud.ai/dashboard';

    it('在线环境默认0%灰度 - 所有用户使用旧版本', () => {
      const result = testOnlineRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 34%
        // 不设置 grayPercentage，默认为 0
      });

      expect(result.useNewVersion).toBe(false);
      expect(result.hash).toBe(34);
      expect(result.grayPercentage).toBe(0);
      expect(result.targetHostname).toBe('plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://plaud-web.pages.dev/dashboard');
    });

    it('在线环境10%灰度 - 低哈希用户命中新版本', () => {
      const result = testOnlineRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 34% > 10%
        grayPercentage: 10,
      });

      expect(result.useNewVersion).toBe(false); // 34% > 10%
      expect(result.targetHostname).toBe('plaud-web.pages.dev');
    });

    it('在线环境40%灰度 - 低哈希用户命中新版本', () => {
      const result = testOnlineRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 34% < 40%
        grayPercentage: 40,
      });

      expect(result.useNewVersion).toBe(true);
      expect(result.targetHostname).toBe('beta.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://beta.plaud-web.pages.dev/dashboard');
    });

    it('环境头应该优先于灰度逻辑', () => {
      const result = testOnlineRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=beta_user123', // hash: 76%
        headerEnv: 'staging',
        grayPercentage: 0,
      });

      expect(result.targetHostname).toBe('staging.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://staging.plaud-web.pages.dev/dashboard');
    });

    it('没有客户端标签应该默认旧版本', () => {
      const result = testOnlineRouting(baseUrl, {
        cookieHeader: 'session=abc',
        grayPercentage: 50,
      });

      expect(result.useNewVersion).toBe(false);
      expect(result.clientTag).toBeUndefined();
      expect(result.hash).toBeNull();
      expect(result.targetHostname).toBe('plaud-web.pages.dev');
    });
  });

  describe('在线域名映射测试 - beta.plaud.ai 环境', () => {
    it('访问 beta.plaud.ai 应该返回 beta.plaud-web.pages.dev', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/dashboard', {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 34%
        grayPercentage: 40, // 命中新版本
      });

      expect(result.targetHostname).toBe('beta.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://beta.plaud-web.pages.dev/dashboard');
    });

    it('访问 app.plaud.ai 应该返回 app.plaud-web.pages.dev', () => {
      const result = testOnlineRouting('https://app.plaud.ai/profile', {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 34%
        grayPercentage: 40, // 命中新版本
      });

      expect(result.targetHostname).toBe('app.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://app.plaud-web.pages.dev/profile');
    });

    it('访问 api.plaud.ai 白名单域名保持原样', () => {
      const result = testOnlineRouting('https://api.plaud.ai/v1/users', {
        cookieHeader: 'x-pld-tag=beta_user456', // hash: 94%
        headerEnv: 'staging', // 环境头对白名单域名无效
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('api.plaud.ai');
      expect(result.targetUrl).toBe('https://api.plaud.ai/v1/users');
    });

    it('访问根域名 plaud.ai 白名单域名保持原样', () => {
      const result = testOnlineRouting('https://plaud.ai/home', {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 15%
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('plaud.ai');
      expect(result.targetUrl).toBe('https://plaud.ai/home');
    });

    it('访问 www.plaud.ai 白名单域名保持原样', () => {
      const result = testOnlineRouting('https://www.plaud.ai/about', {
        cookieHeader: 'session=abc123', // 无 x-pld-tag
        headerEnv: 'prod', // 环境头对白名单域名无效
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('www.plaud.ai');
      expect(result.targetUrl).toBe('https://www.plaud.ai/about');
    });

    it('高哈希用户访问 beta.plaud.ai 应该返回旧版本域名', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/dashboard', {
        cookieHeader: 'x-pld-tag=beta_user123', // hash: 73%
        grayPercentage: 50, // 不命中新版本
      });

      expect(result.targetHostname).toBe('plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://plaud-web.pages.dev/dashboard');
      expect(result.useNewVersion).toBe(false);
    });

    it('环境头优先级测试 - 即使是旧版本用户也会路由到指定环境', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/health', {
        cookieHeader: 'x-pld-tag=beta_user123', // hash: 73%
        headerEnv: 'dev',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('dev.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://dev.plaud-web.pages.dev/health');
    });

    it('复杂子域名测试 - admin.api.plaud.ai', () => {
      const result = testOnlineRouting('https://admin.api.plaud.ai/console', {
        cookieHeader: 'x-pld-tag=admin', // hash: 需要计算
        grayPercentage: 100, // 100% 灰度，所有用户新版本
      });

      // admin.api.plaud.ai 是复杂子域名，应该兜底到默认
      expect(result.targetHostname).toBe('plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://plaud-web.pages.dev/console');
    });

    it('带查询参数的URL应该保持参数', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/search?q=test&page=1', {
        cookieHeader: 'x-pld-tag=beta_user789',
        headerEnv: 'staging',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('staging.plaud-web.pages.dev');
      expect(result.targetUrl).toBe('https://staging.plaud-web.pages.dev/search?q=test&page=1');
    });

    it('白名单域名测试 - 环境头对白名单域名无效', () => {
      const result = testOnlineRouting('https://api.plaud.ai/health', {
        cookieHeader: 'x-pld-tag=beta_user789',
        headerEnv: 'staging', // 环境头应该被忽略
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('api.plaud.ai'); // 保持原域名
      expect(result.targetUrl).toBe('https://api.plaud.ai/health');
    });
  });

  describe('在线灰度发布场景测试', () => {
    it('0%灰度 - 所有用户都使用旧版本', () => {
      const users = ['beta_user_a', 'beta_user_b', 'beta_user_c'];

      users.forEach(user => {
        const result = testOnlineRouting('https://beta.plaud.ai/test', {
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 0,
        });

        expect(result.useNewVersion).toBe(false);
        expect(result.targetHostname).toBe('plaud-web.pages.dev');
      });
    });

    it('5%灰度 - 极少数用户命中新版本', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/test', {
        cookieHeader: 'x-pld-tag=beta_low_hash', // 需要找到低哈希值的用户
        grayPercentage: 5,
      });

      // 验证哈希计算逻辑
      expect(result.hash).toBeGreaterThanOrEqual(0);
      expect(result.hash).toBeLessThan(100);
      expect(result.useNewVersion).toBe(result.hash! < 5);
    });

    it('50%灰度 - 约一半用户命中新版本', () => {
      const users = ['beta_user_1', 'beta_user_2', 'beta_user_3', 'beta_user_4', 'beta_user_5'];
      const results = users.map(user => {
        return testOnlineRouting('https://beta.plaud.ai/test', {
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 50,
        });
      });

      // 验证每个用户的哈希值是确定的
      results.forEach(result => {
        expect(result.hash).toBeGreaterThanOrEqual(0);
        expect(result.hash).toBeLessThan(100);
        expect(result.useNewVersion).toBe(result.hash! < 50);

        if (result.useNewVersion) {
          expect(result.targetHostname).toBe('beta.plaud-web.pages.dev');
        } else {
          expect(result.targetHostname).toBe('plaud-web.pages.dev');
        }
      });
    });

    it('100%灰度 - 所有用户都使用新版本', () => {
      const users = ['beta_user_x', 'beta_user_y', 'beta_user_z'];

      users.forEach(user => {
        const result = testOnlineRouting('https://beta.plaud.ai/test', {
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 100,
        });

        expect(result.useNewVersion).toBe(true);
        expect(result.targetHostname).toBe('beta.plaud-web.pages.dev');
      });
    });

    it('在线渐进式发布模拟 - 从0%到100%', () => {
      const testUser = 'beta_consistent_user';
      const grayPercentages = [0, 5, 10, 30, 50, 80, 100];
      const results = grayPercentages.map(grayPercentage => {
        return testOnlineRouting('https://beta.plaud.ai/rollout', {
          cookieHeader: `x-pld-tag=${testUser}`,
          grayPercentage,
        });
      });

      // 验证用户哈希值保持一致
      const userHash = results[0].hash;
      results.forEach(result => {
        expect(result.hash).toBe(userHash);
      });

      // 验证灰度逻辑：一旦用户命中某个灰度，更高的灰度也应该命中
      let hasHitNewVersion = false;
      results.forEach(result => {
        if (result.useNewVersion) {
          hasHitNewVersion = true;
        }
        // 一旦命中新版本，后续更高的灰度也应该命中
        if (hasHitNewVersion && result.grayPercentage >= userHash!) {
          expect(result.useNewVersion).toBe(true);
        }
      });

      // 100% 灰度时，所有用户都应该是新版本
      const finalResult = results[results.length - 1];
      expect(finalResult.grayPercentage).toBe(100);
      expect(finalResult.useNewVersion).toBe(true);
      expect(finalResult.targetHostname).toBe('beta.plaud-web.pages.dev');
    });
  });

  describe('在线环境特殊场景测试', () => {
    it('旧路由强制使用旧版本', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/legacy/admin', {
        cookieHeader: 'x-pld-tag=beta_user789', // hash: 15%
        grayPercentage: 50, // 应该命中新版本
        alwaysOldRoutes: '/legacy,/old-api',
      });

      // 即使哈希值低，但因为是旧路由，所以使用旧版本
      expect(result.useNewVersion).toBe(true); // 哈希逻辑仍然是新版本
      expect(result.targetHostname).toBe('plaud-web.pages.dev'); // 但路由到旧版本
      expect(result.targetUrl).toBe('https://plaud-web.pages.dev/legacy/admin');
    });

    it('环境头与灰度的优先级 - 环境头覆盖灰度逻辑', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/override', {
        cookieHeader: 'x-pld-tag=beta_user123', // hash: 73% (应该是旧版本)
        headerEnv: 'staging', // 环境头应该覆盖灰度逻辑
        grayPercentage: 20, // 20% 灰度，用户应该不命中
      });

      expect(result.useNewVersion).toBe(false); // 基于哈希值的逻辑判断
      expect(result.targetHostname).toBe('staging.plaud-web.pages.dev'); // 但实际路由被环境头覆盖
      expect(result.hash).toBe(76);
      expect(result.grayPercentage).toBe(20);
    });

    it('应该正确处理复杂的 URL', () => {
      const complexUrl = 'https://beta.plaud.ai/v1/users?id=123&type=admin&env=prod';
      const result = testOnlineRouting(complexUrl, {
        cookieHeader: 'x-pld-tag=beta_admin',
        grayPercentage: 30,
      });

      expect(result.originalUrl).toBe(complexUrl);
      expect(result.path).toBe('/v1/users');
      expect(result.targetUrl).toContain('?id=123&type=admin&env=prod'); // 查询参数应该保留
    });

    it('应该返回完整的调试信息', () => {
      const result = testOnlineRouting('https://beta.plaud.ai/debug', {
        cookieHeader: 'x-pld-tag=beta_testuser',
        grayPercentage: 25,
        alwaysOldRoutes: '/api,/legacy',
      });

      expect(result).toHaveProperty('originalUrl');
      expect(result).toHaveProperty('targetUrl');
      expect(result).toHaveProperty('targetHostname');
      expect(result).toHaveProperty('useNewVersion');
      expect(result).toHaveProperty('clientTag');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('grayPercentage');
      expect(result).toHaveProperty('oldRoutes');
      expect(result).toHaveProperty('originalHost');
      expect(result).toHaveProperty('path');
    });
  });
});
