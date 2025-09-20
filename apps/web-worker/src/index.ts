// 导出所有 worker 功能 - JavaScript 版本

// Import JavaScript workers
const onlineWorker = require('./online.worker.js');
const offlineWorker = require('./offline.worker.js');

// Re-export online worker functions
export const {
  handleOnlineRequest,
  handleBatchRequests
} = onlineWorker;

// Re-export offline worker functions
export const {
  hashStringToPercentage,
  parseCookies,
  buildNewPagesOrigin,
  handleRouteRequest,
  processData,
  calculate
} = offlineWorker;

// Export types for better development experience
export type WorkerMode = 'online' | 'offline';
