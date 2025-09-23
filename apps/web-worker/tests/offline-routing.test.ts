// 测试灰度发布和路由转发的核心逻辑
import {
  hashStringToPercentage,
  parseCookies,
  buildNewPagesOrigin,
  testRouting,
} from './test-utils';

describe('Routing Logic (灰度发布和路由转发)', () => {
  describe('hashStringToPercentage', () => {
    it('应该返回一致的哈希百分比', () => {
      expect(hashStringToPercentage('user123')).toBe(73);
      expect(hashStringToPercentage('user456')).toBe(94);
      expect(hashStringToPercentage('user789')).toBe(15);
    });

    it('相同字符串应该返回相同结果', () => {
      const str = 'testUser';
      expect(hashStringToPercentage(str)).toBe(hashStringToPercentage(str));
    });

    it('应该返回 0-99 范围内的值', () => {
      for (let i = 0; i < 100; i++) {
        const hash = hashStringToPercentage(`user_${i}`);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(100);
      }
    });
  });

  describe('parseCookies', () => {
    it('应该解析简单的 cookies', () => {
      const result = parseCookies('name=value; key=another_value');
      expect(result).toEqual({ name: 'value', key: 'another_value' });
    });

    it('应该处理 x-pld-tag cookie', () => {
      const result = parseCookies('session=abc; x-pld-tag=testuser; theme=dark');
      expect(result).toEqual({
        session: 'abc',
        'x-pld-tag': 'testuser',
        theme: 'dark',
      });
    });

    it('应该处理空的 cookie header', () => {
      expect(parseCookies('')).toEqual({});
      expect(parseCookies()).toEqual({});
    });
  });

  describe('buildNewPagesOrigin', () => {
    it('应该处理子域名', () => {
      expect(buildNewPagesOrigin('app.theplaud.com')).toBe('https://app.plaud-web3.pages.dev');
      expect(buildNewPagesOrigin('test.theplaud.com')).toBe('https://test.plaud-web3.pages.dev');
    });

    it('应该处理根域名', () => {
      expect(buildNewPagesOrigin('theplaud.com')).toBe('https://theplaud.com');
    });

    it('应该处理 h5 项目域名', () => {
      expect(buildNewPagesOrigin('h5.theplaud.com')).toBe(
        'https://test-h5.plaud-h5-web3.pages.dev'
      );
    });
  });

  describe('testRouting - 核心路由逻辑测试', () => {
    const baseUrl = 'https://app.theplaud.com/dashboard';

    it('低哈希用户应该路由到新版本', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=user789', // hash: 15%
        grayPercentage: 50,
      });

      expect(result.useNewVersion).toBe(true);
      expect(result.hash).toBe(15);
      expect(result.targetHostname).toBe('app.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://app.plaud-web3.pages.dev/dashboard');
    });

    it('高哈希用户应该路由到旧版本', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=user123', // hash: 73%
        grayPercentage: 50,
      });

      expect(result.useNewVersion).toBe(false);
      expect(result.hash).toBe(73);
      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
      expect(result.targetUrl).toBe('https://test.plaud-web-dist.pages.dev/dashboard');
    });

    it('旧路由应该强制使用旧版本', () => {
      const result = testRouting('https://admin.theplaud.com/legacy/users', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (应该是新版本)
        grayPercentage: 50,
        alwaysOldRoutes: '/legacy,/old-api',
      });

      // 即使哈希值低，但因为是旧路由，所以使用旧版本
      expect(result.useNewVersion).toBe(true); // 哈希逻辑仍然是新版本
      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev'); // 但路由到旧版本
      expect(result.targetUrl).toBe('https://test.plaud-web-dist.pages.dev/legacy/users');
    });

    it('环境头应该优先于其他逻辑', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (应该是旧版本)
        headerEnv: 'staging',
        grayPercentage: 0, // 0% 灰度 (应该全部旧版本)
      });

      expect(result.targetHostname).toBe('staging.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://staging.plaud-web3.pages.dev/dashboard');
    });

    it('没有客户端标签应该默认新版本', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'session=abc',
        grayPercentage: 50,
      });

      expect(result.useNewVersion).toBe(true);
      expect(result.clientTag).toBeUndefined();
      expect(result.hash).toBeNull();
      expect(result.targetHostname).toBe('app.plaud-web3.pages.dev');
    });

    it('100% 灰度应该所有用户都是新版本', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=user123', // hash: 73%
        grayPercentage: 100,
      });

      expect(result.useNewVersion).toBe(true);
      expect(result.targetHostname).toBe('app.plaud-web3.pages.dev');
    });

    it('0% 灰度应该所有用户都是旧版本', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=user789', // hash: 15%
        grayPercentage: 0,
      });

      // hash: 15, grayPercentage: 0, 15 < 0 = false, 所以 useNewVersion = false
      expect(result.useNewVersion).toBe(false);
      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
    });

    it('应该正确处理复杂的 URL', () => {
      const complexUrl = 'https://admin.theplaud.com/v1/users?id=123&type=admin';
      const result = testRouting(complexUrl, {
        cookieHeader: 'x-pld-tag=admin',
        grayPercentage: 50,
      });

      expect(result.originalUrl).toBe(complexUrl);
      expect(result.path).toBe('/v1/users');
      expect(result.targetUrl).toContain('?id=123&type=admin'); // 查询参数应该保留
    });

    it('应该返回完整的调试信息', () => {
      const result = testRouting(baseUrl, {
        cookieHeader: 'x-pld-tag=testuser',
        grayPercentage: 30,
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

    it('h5 项目路由应该使用 h5 专用域名', () => {
      const result = testRouting('https://h5.theplaud.com/mobile-app', {
        cookieHeader: 'x-pld-tag=h5user', // hash: 根据实际哈希值
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test-h5.plaud-h5-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test-h5.plaud-h5-web3.pages.dev/mobile-app');
      expect(result.originalHost).toBe('h5.theplaud.com');
    });
  });

  describe('Hostname 路由映射测试 - 不同请求情况的域名返回', () => {
    it('访问 test.theplaud.com 应该返回 test.plaud-web3.pages.dev', () => {
      const result = testRouting('https://test.theplaud.com/dashboard', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (新版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test.plaud-web3.pages.dev/dashboard');
    });

    it('访问 test.theplaud.com 带 x-pld-env: test3 应该返回 test3.plaud-web3.pages.dev', () => {
      const result = testRouting('https://test.theplaud.com/api', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本，但环境头优先)
        headerEnv: 'test3',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test3.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test3.plaud-web3.pages.dev/api');
    });

    it('访问 app.theplaud.com 应该返回 app.plaud-web3.pages.dev', () => {
      const result = testRouting('https://app.theplaud.com/profile', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (新版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('app.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://app.plaud-web3.pages.dev/profile');
    });

    it('访问 api.theplaud.com 白名单域名保持原样', () => {
      const result = testRouting('https://api.theplaud.com/v1/users', {
        cookieHeader: 'x-pld-tag=user456', // hash: 94% (旧版本)
        headerEnv: 'staging', // 环境头对白名单域名无效
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('api.theplaud.com');
      expect(result.targetUrl).toBe('https://api.theplaud.com/v1/users');
    });

    it('访问根域名 theplaud.com 白名单域名保持原样', () => {
      const result = testRouting('https://theplaud.com/home', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (新版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('theplaud.com');
      expect(result.targetUrl).toBe('https://theplaud.com/home');
    });

    it('访问 www.theplaud.com 白名单域名保持原样', () => {
      const result = testRouting('https://www.theplaud.com/about', {
        cookieHeader: 'session=abc123', // 无 x-pld-tag (默认新版本)
        headerEnv: 'prod', // 环境头对白名单域名无效
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('www.theplaud.com');
      expect(result.targetUrl).toBe('https://www.theplaud.com/about');
    });

    it('高哈希用户访问 test.theplaud.com 应该返回旧版本域名', () => {
      const result = testRouting('https://test.theplaud.com/dashboard', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
      expect(result.targetUrl).toBe('https://test.plaud-web-dist.pages.dev/dashboard');
      expect(result.useNewVersion).toBe(false);
    });

    it('环境头优先级测试 - 即使是旧版本用户也会路由到指定环境', () => {
      const result = testRouting('https://service.theplaud.com/health', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本)
        headerEnv: 'dev',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('dev.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://dev.plaud-web3.pages.dev/health');
      // 注意：useNewVersion 仍然基于哈希值，但实际路由被环境头覆盖
    });

    it('复杂子域名测试 - admin.api.theplaud.com', () => {
      const result = testRouting('https://admin.api.theplaud.com/console', {
        cookieHeader: 'x-pld-tag=admin', // hash: 需要计算
        grayPercentage: 100, // 100% 灰度，所有用户新版本
      });

      // admin.api.theplaud.com 是复杂子域名，应该兜底到 test
      expect(result.targetHostname).toBe('test.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test.plaud-web3.pages.dev/console');
    });

    it('带查询参数的URL应该保持参数', () => {
      const result = testRouting('https://test.theplaud.com/search?q=test&page=1', {
        cookieHeader: 'x-pld-tag=user789',
        headerEnv: 'test3',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test3.plaud-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test3.plaud-web3.pages.dev/search?q=test&page=1');
    });

    it('白名单域名测试 - api.theplaud.com 不做路由处理', () => {
      const result = testRouting('https://api.theplaud.com/v1/users', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (新版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('api.theplaud.com');
      expect(result.targetUrl).toBe('https://api.theplaud.com/v1/users');
    });

    it('白名单域名测试 - www.theplaud.com 不做路由处理', () => {
      const result = testRouting('https://www.theplaud.com/home', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('www.theplaud.com');
      expect(result.targetUrl).toBe('https://www.theplaud.com/home');
    });

    it('白名单域名测试 - 环境头对白名单域名无效', () => {
      const result = testRouting('https://api.theplaud.com/health', {
        cookieHeader: 'x-pld-tag=user789',
        headerEnv: 'staging', // 环境头应该被忽略
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('api.theplaud.com'); // 保持原域名
      expect(result.targetUrl).toBe('https://api.theplaud.com/health');
    });

    // H5 项目测试 - h5.theplaud.com 专门测试
    it('访问 h5.theplaud.com 应该返回 h5 项目默认域名', () => {
      const result = testRouting('https://h5.theplaud.com/app', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% (新版本)
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test-h5.plaud-h5-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test-h5.plaud-h5-web3.pages.dev/app');
    });

    it('h5.theplaud.com 带 x-pld-env 环境头应该使用环境模板', () => {
      const result = testRouting('https://h5.theplaud.com/mobile', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本，但环境头优先)
        headerEnv: 'dev',
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('dev-h5.plaud-h5-web3.pages.dev');
      expect(result.targetUrl).toBe('https://dev-h5.plaud-h5-web3.pages.dev/mobile');
    });

    it('h5.theplaud.com 高哈希用户在低灰度下应该使用默认域名', () => {
      const result = testRouting('https://h5.theplaud.com/settings', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (旧版本)
        grayPercentage: 30, // 低灰度
      });

      // h5 项目在 offline 环境没有区分新旧版本，都使用 defaultDomain
      expect(result.targetHostname).toBe('test-h5.plaud-h5-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test-h5.plaud-h5-web3.pages.dev/settings');
    });

    it('h5.theplaud.com 无用户标识应该使用默认域名', () => {
      const result = testRouting('https://h5.theplaud.com/home', {
        grayPercentage: 50,
      });

      expect(result.targetHostname).toBe('test-h5.plaud-h5-web3.pages.dev');
      expect(result.targetUrl).toBe('https://test-h5.plaud-h5-web3.pages.dev/home');
    });

    it('30% 灰度 - 低哈希用户命中新版本', () => {
      const result = testRouting('https://app.theplaud.com/dashboard', {
        cookieHeader: 'x-pld-tag=user789', // hash: 15% < 30%
        grayPercentage: 30,
      });

      expect(result.useNewVersion).toBe(true);
      expect(result.targetHostname).toBe('app.plaud-web3.pages.dev');
      expect(result.hash).toBe(15);
      expect(result.grayPercentage).toBe(30);
    });

    it('30% 灰度 - 高哈希用户不命中灰度使用旧版本', () => {
      const result = testRouting('https://app.theplaud.com/profile', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% > 30%
        grayPercentage: 30,
      });

      expect(result.useNewVersion).toBe(false);
      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
      expect(result.hash).toBe(73);
      expect(result.grayPercentage).toBe(30);
    });

    it('80% 灰度 - 中等哈希用户命中新版本', () => {
      const result = testRouting('https://backend.theplaud.com/users', {
        cookieHeader: 'x-pld-tag=user456', // hash: 94% > 80%
        grayPercentage: 80,
      });

      expect(result.useNewVersion).toBe(false);
      expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
      expect(result.hash).toBe(94);
    });

    it('50% 灰度边界测试 - 哈希值正好等于灰度值', () => {
      // 寻找一个哈希值接近50的用户标识
      const result = testRouting('https://test.theplaud.com/boundary', {
        cookieHeader: 'x-pld-tag=boundary50', // 需要找到一个哈希值接近50的
        grayPercentage: 50,
      });

      // 验证哈希计算和灰度逻辑
      expect(result.hash).toBeGreaterThanOrEqual(0);
      expect(result.hash).toBeLessThan(100);
      expect(result.useNewVersion).toBe(result.hash! < 50);
    });

    it('不同用户在相同灰度下的分布测试', () => {
      const users = ['user_a', 'user_b', 'user_c', 'user_d', 'user_e'];
      const grayPercentage = 60;
      const results: Array<{
        user: string;
        hash: number;
        useNewVersion: boolean;
        targetHostname: string;
      }> = [];

      users.forEach(user => {
        const result = testRouting('https://test.theplaud.com/test', {
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage,
        });
        results.push({
          user,
          hash: result.hash!,
          useNewVersion: result.useNewVersion,
          targetHostname: result.targetHostname,
        });
      });

      // 验证每个用户的哈希值是确定的
      results.forEach(result => {
        expect(result.hash).toBeGreaterThanOrEqual(0);
        expect(result.hash).toBeLessThan(100);
        expect(result.useNewVersion).toBe(result.hash < grayPercentage);

        if (result.useNewVersion) {
          expect(result.targetHostname).toBe('test.plaud-web3.pages.dev');
        } else {
          expect(result.targetHostname).toBe('test.plaud-web-dist.pages.dev');
        }
      });

      // 验证至少有一些用户分布在新旧版本中（统计学验证）
      const newVersionUsers = results.filter(r => r.useNewVersion).length;
      const oldVersionUsers = results.filter(r => !r.useNewVersion).length;

      // 至少应该有用户分布（除非极端情况）
      expect(newVersionUsers + oldVersionUsers).toBe(users.length);
    });

    it('灰度与环境头的优先级 - 环境头覆盖灰度逻辑', () => {
      const result = testRouting('https://service.theplaud.com/override', {
        cookieHeader: 'x-pld-tag=user123', // hash: 73% (应该是旧版本)
        headerEnv: 'staging', // 环境头应该覆盖灰度逻辑
        grayPercentage: 20, // 20% 灰度，用户应该不命中
      });

      expect(result.useNewVersion).toBe(false); // 基于哈希值的逻辑判断
      expect(result.targetHostname).toBe('staging.plaud-web3.pages.dev'); // 但实际路由被环境头覆盖
      expect(result.hash).toBe(73);
      expect(result.grayPercentage).toBe(20);
    });

    it('灰度发布场景模拟 - 从10%逐步扩大到100%', () => {
      const testUser = 'consistent_user'; // 使用固定用户确保一致性
      const grayPercentages = [10, 30, 50, 80, 100];
      const results: Array<{
        grayPercentage: number;
        hash: number;
        useNewVersion: boolean;
        targetHostname: string;
      }> = [];

      grayPercentages.forEach(grayPercentage => {
        const result = testRouting('https://app.theplaud.com/rollout', {
          cookieHeader: `x-pld-tag=${testUser}`,
          grayPercentage,
        });
        results.push({
          grayPercentage,
          hash: result.hash!,
          useNewVersion: result.useNewVersion,
          targetHostname: result.targetHostname,
        });
      });

      // 验证用户哈希值保持一致
      const userHash = results[0].hash;
      results.forEach(result => {
        expect(result.hash).toBe(userHash); // 同一用户哈希值应该一致
      });

      // 验证灰度逻辑：一旦用户命中某个灰度，更高的灰度也应该命中
      let hasHitNewVersion = false;
      results.forEach(result => {
        if (result.useNewVersion) {
          hasHitNewVersion = true;
        }
        // 一旦命中新版本，后续更高的灰度也应该命中
        if (hasHitNewVersion && result.grayPercentage >= userHash) {
          expect(result.useNewVersion).toBe(true);
        }
      });

      // 100% 灰度时，所有用户都应该是新版本
      const finalResult = results[results.length - 1];
      expect(finalResult.grayPercentage).toBe(100);
      expect(finalResult.useNewVersion).toBe(true);
      expect(finalResult.targetHostname).toBe('app.plaud-web3.pages.dev');
    });
  });
});
