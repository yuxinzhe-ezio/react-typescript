// Online Worker - Pure JavaScript version
// Copy this entire file content and use it directly in Web Workers or other environments

// Handle single network request
async function handleOnlineRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      url,
    };
  } catch (error) {
    throw new Error(
      `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Handle multiple requests in parallel
async function handleBatchRequests(urls) {
  const requests = urls.map(url => {
    if (typeof url === 'string') {
      return handleOnlineRequest(url);
    }
    return handleOnlineRequest(url.url, url.options);
  });
  return Promise.all(requests);
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    handleOnlineRequest,
    handleBatchRequests,
  };
} else if (typeof self !== 'undefined') {
  // Web Worker environment
  self.handleOnlineRequest = handleOnlineRequest;
  self.handleBatchRequests = handleBatchRequests;
  
  // Listen for messages in Web Worker
  self.addEventListener('message', async (event) => {
    const { type, payload, id } = event.data;
    
    try {
      let result;
      switch (type) {
        case 'FETCH_DATA':
          result = await handleOnlineRequest(payload.url, payload.options);
          break;
        case 'BATCH_REQUESTS':
          result = await handleBatchRequests(payload.urls);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
      
      self.postMessage({
        type: 'SUCCESS',
        payload: result,
        id,
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: { message: error.message },
        id,
      });
    }
  });
}