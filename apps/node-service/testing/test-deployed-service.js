#!/usr/bin/env node

/**
 * Local testing script for deployed node-service
 * Usage: node test-deployed-service.js [server-url]
 */

const http = require('http');
const https = require('https');

// Configuration
const DEFAULT_SERVER_URL = 'http://localhost:8080'; // Change this to your deployed server URL
const SERVER_URL = process.argv[2] || DEFAULT_SERVER_URL;

// Test utilities
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NodeService-Local-Test/1.0',
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
};

// Test cases
const tests = [
  {
    name: 'Health Check - Demo Endpoint',
    url: `${SERVER_URL}/demo`,
    method: 'GET',
    description: 'Test the basic demo endpoint to verify service is running',
  },
  {
    name: 'Lark Callback - Deployment Status',
    url: `${SERVER_URL}/lark/callback/update-deployment-status`,
    method: 'POST',
    body: {
      status: 'success',
      environment: 'test',
      deploymentId: 'test-' + Date.now(),
      message: 'Test deployment from local testing script',
    },
    description: 'Test the Lark deployment status callback endpoint',
  },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: msg => console.log(`${colors.cyan}🧪${colors.reset} ${msg}`),
};

// Run tests
const runTests = async () => {
  log.info(`Starting tests for node-service at: ${SERVER_URL}`);
  log.info('=' * 60);

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    log.test(`Running: ${test.name}`);
    console.log(`   📝 ${test.description}`);

    try {
      const startTime = Date.now();
      const result = await makeRequest(test.url, {
        method: test.method,
        body: test.body,
      });
      const duration = Date.now() - startTime;

      if (result.status >= 200 && result.status < 300) {
        log.success(`${test.name} - Status: ${result.status} (${duration}ms)`);
        console.log(`   📤 Request: ${test.method} ${test.url}`);
        if (test.body) {
          console.log(`   📋 Body:`, JSON.stringify(test.body, null, 2));
        }
        console.log(`   📥 Response:`, JSON.stringify(result.data, null, 2));
        passedTests++;
      } else {
        log.error(`${test.name} - Status: ${result.status}`);
        console.log(`   📥 Response:`, result.data);
      }
    } catch (error) {
      log.error(`${test.name} - Error: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        log.warning('Connection refused - make sure the server is running and accessible');
      }
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  log.info('=' * 60);
  log.info(`Test Summary: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    log.success('All tests passed! 🎉');
  } else {
    log.warning(`${totalTests - passedTests} tests failed`);
  }
};

// Additional utility functions
const testCustomEndpoint = async (endpoint, method = 'GET', body = null) => {
  log.test(`Testing custom endpoint: ${method} ${endpoint}`);
  try {
    const result = await makeRequest(`${SERVER_URL}${endpoint}`, {
      method,
      body,
    });
    log.success(`Custom test - Status: ${result.status}`);
    console.log(`   📥 Response:`, JSON.stringify(result.data, null, 2));
  } catch (error) {
    log.error(`Custom test failed: ${error.message}`);
  }
};

// CLI interface
if (require.main === module) {
  const command = process.argv[3];

  if (command === '--custom' && process.argv[4]) {
    // Test custom endpoint
    const endpoint = process.argv[4];
    const method = process.argv[5] || 'GET';
    testCustomEndpoint(endpoint, method);
  } else if (command === '--help' || command === '-h') {
    console.log(`
${colors.cyan}Node Service Local Testing Tool${colors.reset}

Usage:
  node test-deployed-service.js [server-url] [options]

Examples:
  node test-deployed-service.js                                    # Test localhost:8080
  node test-deployed-service.js http://your-server.com:8080       # Test remote server
  node test-deployed-service.js http://localhost:8080 --custom /demo GET
  
Options:
  --custom <endpoint> [method]    Test a custom endpoint
  --help, -h                      Show this help message

Default server URL: ${DEFAULT_SERVER_URL}
    `);
  } else {
    // Run all tests
    runTests().catch(console.error);
  }
}

module.exports = {
  makeRequest,
  testCustomEndpoint,
  runTests,
};
