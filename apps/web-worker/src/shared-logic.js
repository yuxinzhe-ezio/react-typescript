/* eslint-disable no-undef */
// 中间文件：为测试提供访问 offline.worker.js 中函数的桥梁
// 这个文件通过 vm 模块动态执行 offline.worker.js 中的代码

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 读取 offline.worker.js 文件内容
const offlineWorkerPath = path.join(__dirname, 'offline.worker.js');
let offlineWorkerCode = fs.readFileSync(offlineWorkerPath, 'utf8');

// 移除 ES6 export 语句，因为 vm 不支持
offlineWorkerCode = offlineWorkerCode
  .replace(/export\s+function\s+/g, 'function ')
  .replace(/export\s*\{[^}]*\}/g, ''); // 移除 export 语句

// 创建沙盒环境
const sandbox = {
  console,
  URL,
  parseInt,
  // 添加必要的全局变量和函数
};

// 在沙盒中执行代码
vm.createContext(sandbox);
vm.runInContext(offlineWorkerCode, sandbox);

// ES6 导出从沙盒中提取的函数
export const hashStringToPercentage = sandbox.hashStringToPercentage;
export const parseCookies = sandbox.parseCookies;
export const buildNewPagesOrigin = sandbox.buildNewPagesOrigin;
export const processRouting = sandbox.processRouting;
