/* eslint-disable no-undef */
// 共享逻辑文件：为测试提供访问 offline 和 online worker 中函数的桥梁
// 这个文件通过 vm 模块动态执行 worker 文件中的代码

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * 加载并解析 worker 文件
 * @param {string} workerType - 'offline' 或 'online'
 * @returns {Object} 包含所有导出函数的对象
 */
const loadWorkerFunctions = workerType => {
  const workerPath = path.join(__dirname, `${workerType}.worker.js`);
  let workerCode = fs.readFileSync(workerPath, 'utf8');

  // 移除 ES6 export 语句，因为 vm 不支持
  workerCode = workerCode
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s*\{[^}]*\}/g, ''); // 移除 export 语句

  // 创建沙盒环境
  const sandbox = {
    console,
    URL,
    parseInt,
    Math,
    // 添加必要的全局变量和函数
  };

  // 在沙盒中执行代码
  vm.createContext(sandbox);
  vm.runInContext(workerCode, sandbox);

  return {
    hashStringToPercentage: sandbox.hashStringToPercentage,
    parseCookies: sandbox.parseCookies,
    buildNewPagesOrigin: sandbox.buildNewPagesOrigin,
    processRouting: sandbox.processRouting,
  };
};

// 加载 offline 和 online 的函数
const offlineFunctions = loadWorkerFunctions('offline');
const onlineFunctions = loadWorkerFunctions('online');

// 导出 offline 版本的函数（保持向后兼容）
export const hashStringToPercentage = offlineFunctions.hashStringToPercentage;
export const parseCookies = offlineFunctions.parseCookies;
export const buildNewPagesOrigin = offlineFunctions.buildNewPagesOrigin;
export const processRouting = offlineFunctions.processRouting;

// 导出带命名空间的函数，方便区分使用
export const offline = {
  hashStringToPercentage: offlineFunctions.hashStringToPercentage,
  parseCookies: offlineFunctions.parseCookies,
  buildNewPagesOrigin: offlineFunctions.buildNewPagesOrigin,
  processRouting: offlineFunctions.processRouting,
};

export const online = {
  hashStringToPercentage: onlineFunctions.hashStringToPercentage,
  parseCookies: onlineFunctions.parseCookies,
  buildNewPagesOrigin: onlineFunctions.buildNewPagesOrigin,
  processRouting: onlineFunctions.processRouting,
};

// 兼容性导出（保持旧的命名方式）
export const buildNewPagesOriginOnline = onlineFunctions.buildNewPagesOrigin;
export const processRoutingOnline = onlineFunctions.processRouting;
