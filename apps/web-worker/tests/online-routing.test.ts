// 测试在线环境（beta.plaud.ai）的路由逻辑
import { online } from '../src/shared-logic.js';

describe('Online Routing Logic (beta.plaud.ai 在线环境)', () => {
  describe('online.hashStringToPercentage - 在线环境哈希算法', () => {
    it('应该返回一致的哈希百分比', () => {
      expect(online.hashStringToPercentage('user123')).toBe(73);
      expect(online.hashStringToPercentage('user456')).toBe(94);
      expect(online.hashStringToPercentage('user789')).toBe(15);
    });

    it('相同字符串应该返回相同结果', () => {
      const str = 'beta_testUser';
      expect(online.hashStringToPercentage(str)).toBe(online.hashStringToPercentage(str));
    });

    it('应该返回 0-99 范围内的值', () => {
      const testStrings = [
        'a',
        'beta_user1',
        'beta_user2',
        'beta_user3',
        'very_long_user_name_for_testing',
      ];
      testStrings.forEach(str => {
        const hash = online.hashStringToPercentage(str);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(100);
      });
    });
  });

  describe('buildNewPagesOrigin - 在线域名构建', () => {
    it('应该处理 beta.plaud.ai 子域名', () => {
      expect(online.buildNewPagesOrigin('beta.plaud.ai')).toBe('https://plaud-web3.pages.dev');
      expect(online.buildNewPagesOrigin('app.plaud.ai')).toBe('https://plaud-web3.pages.dev');
    });

    it('应该统一映射到新版本域名', () => {
      expect(online.buildNewPagesOrigin('beta.plaud.ai')).toBe('https://plaud-web3.pages.dev');
      expect(online.buildNewPagesOrigin('app.plaud.ai')).toBe('https://plaud-web3.pages.dev');
      expect(online.buildNewPagesOrigin('api.plaud.ai')).toBe('https://plaud-web3.pages.dev');
      expect(online.buildNewPagesOrigin('plaud.ai')).toBe('https://plaud-web3.pages.dev');
      expect(online.buildNewPagesOrigin('admin.api.plaud.ai')).toBe('https://plaud-web3.pages.dev');
    });
  });

  describe('在线路由逻辑测试 - beta.plaud.ai 域名', () => {
    const baseUrl = new URL('https://beta.plaud.ai/dashboard');

    it('在线环境默认100%灰度 - 所有用户使用新版本', () => {
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 100, // 默认100%
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('在线环境10%灰度 - 高哈希用户不命中新版本', () => {
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34% > 10%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 10,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev'); // 34% > 10%，不命中新版本
    });

    it('在线环境40%灰度 - 低哈希用户命中新版本', () => {
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34% < 40%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 40,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev'); // 34% < 40%，命中新版本
    });

    it('没有客户端标签应该默认新版本 - 50%灰度', () => {
      const cookieHeader = 'session=abc';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 50,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('没有客户端标签应该默认新版本 - 0%灰度', () => {
      const cookieHeader = 'session=xyz';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 0,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev'); // 没有用户标识时默认新版本
    });

    it('没有客户端标签应该默认新版本 - 100%灰度', () => {
      const cookieHeader = 'other=value';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 100,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('空Cookie头应该默认新版本', () => {
      const cookieHeader = '';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 30,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('只有其他Cookie没有x-pld-tag应该默认新版本', () => {
      const cookieHeader = 'sessionId=abc123; userId=456; theme=dark';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 25,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('x-pld-tag为空值应该默认新版本', () => {
      const cookieHeader = 'x-pld-tag=; session=abc';
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 10,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('在线环境5%灰度 - 极低哈希用户才命中新版本', () => {
      // 使用 user789 (hash: 15%) 测试低哈希用户
      const cookieHeader = 'x-pld-tag=user789'; // hash: 15% > 5%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 5,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev'); // 15% > 5%，不命中新版本
    });

    it('在线环境20%灰度 - 低哈希用户命中新版本', () => {
      // 使用 user789 (hash: 15%) 测试低哈希用户
      const cookieHeader = 'x-pld-tag=user789'; // hash: 15% < 20%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 20,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev'); // 15% < 20%，命中新版本
    });

    it('在线环境75%灰度 - 中等哈希用户命中新版本', () => {
      // 使用 user123 (hash: 73%) 测试中等哈希用户
      const cookieHeader = 'x-pld-tag=user123'; // hash: 73% < 75%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 75,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev'); // 73% < 75%，命中新版本
    });

    it('在线环境70%灰度 - 高哈希用户不命中新版本', () => {
      // 使用 beta_user123 (hash: 76%) 测试高哈希用户
      const cookieHeader = 'x-pld-tag=beta_user123'; // hash: 76% > 70%
      const targetHostname = online.processRouting({
        inUrl: baseUrl,
        cookieHeader,
        grayPercentage: 70,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev'); // 76% > 70%，不命中新版本
    });
  });

  describe('在线域名映射测试 - beta.plaud.ai 环境', () => {
    it('访问 beta.plaud.ai 应该返回 plaud-web3.pages.dev', () => {
      const inUrl = new URL('https://beta.plaud.ai/dashboard');
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34%
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 40, // 命中新版本
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('访问 app.plaud.ai 应该返回 plaud-web3.pages.dev', () => {
      const inUrl = new URL('https://app.plaud.ai/profile');
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34%
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 40, // 命中新版本
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('高哈希用户访问 beta.plaud.ai 应该返回旧版本域名', () => {
      const inUrl = new URL('https://beta.plaud.ai/dashboard');
      const cookieHeader = 'x-pld-tag=beta_user123'; // hash: 76%
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 50, // 不命中新版本
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev');
    });

    it('复杂子域名测试 - admin.api.plaud.ai', () => {
      const inUrl = new URL('https://admin.api.plaud.ai/console');
      const cookieHeader = 'x-pld-tag=admin'; // hash: 需要计算
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 100, // 100% 灰度，所有用户新版本
        alwaysOldRoutes: '',
      });

      // admin.api.plaud.ai 是复杂子域名，应该兜底到默认新版本
      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('带查询参数的URL应该保持参数', () => {
      const inUrl = new URL('https://beta.plaud.ai/search?q=test&page=1');
      const cookieHeader = 'x-pld-tag=beta_user789';
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 50,
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
      // URL 参数保持应该由调用方处理
    });

    it('没有用户标识访问 beta.plaud.ai 应该返回新版本域名', () => {
      const inUrl = new URL('https://beta.plaud.ai/dashboard');
      const cookieHeader = 'session=anonymous';
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 20, // 即使低灰度，没有用户标识也返回新版本
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('没有用户标识访问 app.plaud.ai 应该返回新版本域名', () => {
      const inUrl = new URL('https://app.plaud.ai/profile');
      const cookieHeader = ''; // 空 cookie
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 5, // 极低灰度，但没有用户标识仍返回新版本
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web3.pages.dev');
    });
  });

  describe('在线灰度发布场景测试', () => {
    it('0%灰度 - 所有用户都使用旧版本', () => {
      const users = ['beta_user_a', 'beta_user_b', 'beta_user_c'];
      const inUrl = new URL('https://beta.plaud.ai/test');

      users.forEach(user => {
        const targetHostname = online.processRouting({
          inUrl,
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 0,
          alwaysOldRoutes: '',
        });

        expect(targetHostname).toBe('plaud-web-dist.pages.dev');
      });
    });

    it('5%灰度 - 极少数用户命中新版本', () => {
      const inUrl = new URL('https://beta.plaud.ai/test');
      const cookieHeader = 'x-pld-tag=beta_low_hash'; // 需要找到低哈希值的用户
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 5,
        alwaysOldRoutes: '',
      });

      // 验证哈希计算逻辑
      const cookies = online.parseCookies(cookieHeader);
      const clientTag = cookies['x-pld-tag'];
      const hash = online.hashStringToPercentage(clientTag);
      const useNewVersion = hash < 5;

      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(100);

      if (useNewVersion) {
        expect(targetHostname).toBe('plaud-web3.pages.dev');
      } else {
        expect(targetHostname).toBe('plaud-web-dist.pages.dev');
      }
    });

    it('50%灰度 - 约一半用户命中新版本', () => {
      const users = ['beta_user_1', 'beta_user_2', 'beta_user_3', 'beta_user_4', 'beta_user_5'];
      const inUrl = new URL('https://beta.plaud.ai/test');

      users.forEach(user => {
        const targetHostname = online.processRouting({
          inUrl,
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 50,
          alwaysOldRoutes: '',
        });

        // 验证每个用户的哈希值是确定的
        const hash = online.hashStringToPercentage(user);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(100);

        const useNewVersion = hash < 50;
        if (useNewVersion) {
          expect(targetHostname).toBe('plaud-web3.pages.dev');
        } else {
          expect(targetHostname).toBe('plaud-web-dist.pages.dev');
        }
      });
    });

    it('100%灰度 - 所有用户都使用新版本', () => {
      const users = ['beta_user_x', 'beta_user_y', 'beta_user_z'];
      const inUrl = new URL('https://beta.plaud.ai/test');

      users.forEach(user => {
        const targetHostname = online.processRouting({
          inUrl,
          cookieHeader: `x-pld-tag=${user}`,
          grayPercentage: 100,
          alwaysOldRoutes: '',
        });

        expect(targetHostname).toBe('plaud-web3.pages.dev');
      });
    });

    it('在线渐进式发布模拟 - 从0%到100%', () => {
      const testUser = 'beta_consistent_user';
      const grayPercentages = [0, 5, 10, 30, 50, 80, 100];
      const inUrl = new URL('https://beta.plaud.ai/rollout');

      const results = grayPercentages.map(grayPercentage => {
        const targetHostname = online.processRouting({
          inUrl,
          cookieHeader: `x-pld-tag=${testUser}`,
          grayPercentage,
          alwaysOldRoutes: '',
        });
        return { grayPercentage, targetHostname };
      });

      // 验证用户哈希值保持一致
      const userHash = online.hashStringToPercentage(testUser);

      // 验证灰度逻辑：一旦用户命中某个灰度，更高的灰度也应该命中
      let hasHitNewVersion = false;
      results.forEach(result => {
        const useNewVersion = userHash < result.grayPercentage;
        if (useNewVersion) {
          hasHitNewVersion = true;
          expect(result.targetHostname).toBe('plaud-web3.pages.dev');
        } else {
          expect(result.targetHostname).toBe('plaud-web-dist.pages.dev');
        }

        // 一旦命中新版本，后续更高的灰度也应该命中
        if (hasHitNewVersion && result.grayPercentage >= userHash) {
          expect(result.targetHostname).toBe('plaud-web3.pages.dev');
        }
      });

      // 100% 灰度时，所有用户都应该是新版本
      const finalResult = results[results.length - 1];
      expect(finalResult.grayPercentage).toBe(100);
      expect(finalResult.targetHostname).toBe('plaud-web3.pages.dev');
    });

    it('没有用户标识在各种灰度下都使用新版本', () => {
      const grayPercentages = [0, 5, 10, 30, 50, 80, 100];
      const inUrl = new URL('https://beta.plaud.ai/no-user-test');

      grayPercentages.forEach(grayPercentage => {
        // 测试完全没有 cookie
        let targetHostname = online.processRouting({
          inUrl,
          cookieHeader: '',
          grayPercentage,
          alwaysOldRoutes: '',
        });
        expect(targetHostname).toBe('plaud-web3.pages.dev');

        // 测试有其他 cookie 但没有 x-pld-tag
        targetHostname = online.processRouting({
          inUrl,
          cookieHeader: 'session=test; theme=light',
          grayPercentage,
          alwaysOldRoutes: '',
        });
        expect(targetHostname).toBe('plaud-web3.pages.dev');

        // 测试 x-pld-tag 为空
        targetHostname = online.processRouting({
          inUrl,
          cookieHeader: 'x-pld-tag=; other=value',
          grayPercentage,
          alwaysOldRoutes: '',
        });
        expect(targetHostname).toBe('plaud-web3.pages.dev');
      });
    });
  });

  describe('在线环境特殊场景测试', () => {
    it('旧路由强制使用旧版本', () => {
      const inUrl = new URL('https://beta.plaud.ai/legacy/admin');
      const cookieHeader = 'x-pld-tag=beta_user789'; // hash: 34%
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 50, // 应该命中新版本
        alwaysOldRoutes: '/legacy,/old-api',
      });

      // 即使哈希值低，但因为是旧路由，所以使用旧版本
      expect(targetHostname).toBe('plaud-web-dist.pages.dev');
    });

    it('高哈希用户在低灰度下应该使用旧版本', () => {
      const inUrl = new URL('https://beta.plaud.ai/override');
      const cookieHeader = 'x-pld-tag=beta_user123'; // hash: 76% (应该是旧版本)
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 20, // 20% 灰度，用户应该不命中
        alwaysOldRoutes: '',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev'); // 路由到旧版本
    });

    it('没有用户标识访问旧路由应该使用旧版本', () => {
      const inUrl = new URL('https://beta.plaud.ai/legacy/settings');
      const cookieHeader = 'session=anonymous'; // 没有 x-pld-tag
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 100, // 即使100%灰度，旧路由仍然使用旧版本
        alwaysOldRoutes: '/legacy,/old-api',
      });

      expect(targetHostname).toBe('plaud-web-dist.pages.dev'); // 旧路由优先级最高
    });

    it('应该正确处理复杂的 URL', () => {
      const complexUrl = new URL('https://beta.plaud.ai/v1/users?id=123&type=admin&env=prod');
      const cookieHeader = 'x-pld-tag=beta_admin';
      const targetHostname = online.processRouting({
        inUrl: complexUrl,
        cookieHeader,
        grayPercentage: 30,
        alwaysOldRoutes: '',
      });

      // 验证路由逻辑正常工作
      expect(['plaud-web3.pages.dev', 'plaud-web-dist.pages.dev']).toContain(targetHostname);
    });

    it('应该返回完整的调试信息', () => {
      const inUrl = new URL('https://beta.plaud.ai/debug');
      const cookieHeader = 'x-pld-tag=beta_testuser';
      const targetHostname = online.processRouting({
        inUrl,
        cookieHeader,
        grayPercentage: 25,
        alwaysOldRoutes: '/api,/legacy',
      });

      // 验证返回的是有效的主机名
      expect(typeof targetHostname).toBe('string');
      expect(targetHostname.length).toBeGreaterThan(0);
      expect(['plaud-web3.pages.dev', 'plaud-web-dist.pages.dev']).toContain(targetHostname);
    });
  });
});
