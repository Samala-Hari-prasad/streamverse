const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
  streamAI: '/api/stream-ai',
  resolveLink: '/api/resolve-link',
  moodRecommend: '/api/mood-recommend',
  gatewaysHealth: '/api/gateways-health',
  watchlist: '/api/watchlist',
};

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test Suite
const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    console.log(`\n📝 Testing: ${name}`);
    await fn();
    console.log(`✅ PASSED: ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${err.message}`);
    failed++;
  }
}

// Test 1: Stream AI Endpoint
tests.push(async () => {
  await test('Stream AI - Valid Request', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.streamAI, {
      movieTitle: 'Blade Runner 2049',
      overview: 'A sci-fi masterpiece',
      genres: ['sci-fi', 'drama'],
      rating: 8.0,
      releaseYear: 2017
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.result) throw new Error('No result in response');
  });
});

tests.push(async () => {
  await test('Stream AI - Missing Title', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.streamAI, {
      overview: 'A sci-fi masterpiece',
      genres: ['sci-fi'],
      rating: 8.0,
      releaseYear: 2017
    });
    
    if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
    if (!response.body.error) throw new Error('No error message');
  });
});

// Test 2: Resolve Link Endpoint
tests.push(async () => {
  await test('Resolve Link - IMDB Provider', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.resolveLink, {
      movieTitle: 'Inception',
      providerDomain: 'streamimdb',
      imdbId: 'tt1375666',
      tmdbId: '27205',
      isTv: false
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.url) throw new Error('No URL in response');
    if (!response.body.url.includes('playimdb')) throw new Error('Expected playimdb URL');
  });
});

tests.push(async () => {
  await test('Resolve Link - Fallback to VIDSRC', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.resolveLink, {
      movieTitle: 'Test Movie',
      providerDomain: 'vidsrc',
      tmdbId: '27205',
      isTv: false
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.url) throw new Error('No URL in response');
  });
});

// Test 3: Mood Recommendation Endpoint
tests.push(async () => {
  await test('Mood Recommend - Valid Mood Query', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.moodRecommend, {
      mood: 'dystopian sci-fi',
      tmdbKey: 'a86a4b74b161d18c36145fc882b7284b'
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.results) throw new Error('No results in response');
    if (!Array.isArray(response.body.results)) throw new Error('Results should be array');
  });
});

tests.push(async () => {
  await test('Mood Recommend - Missing Mood', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.moodRecommend, {
      tmdbKey: 'a86a4b74b161d18c36145fc882b7284b'
    });
    
    if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
    if (!response.body.error) throw new Error('No error message');
  });
});

// Test 4: Gateways Health Endpoint
tests.push(async () => {
  await test('Gateways Health - Check Specific Gateways', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.gatewaysHealth, {
      keys: ['vidsrc', 'netmirror', '7reel']
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.results) throw new Error('No results in response');
    if (!Array.isArray(response.body.results)) throw new Error('Results should be array');
  });
});

tests.push(async () => {
  await test('Gateways Health - Check All Gateways', async () => {
    const response = await makeRequest('POST', API_ENDPOINTS.gatewaysHealth, {});
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.results) throw new Error('No results in response');
  });
});

// Test 5: Watchlist Endpoints
tests.push(async () => {
  await test('Watchlist - Add Item', async () => {
    const deviceId = 'test-device-' + Date.now();
    const response = await makeRequest('POST', API_ENDPOINTS.watchlist, {
      deviceId: deviceId,
      title: 'Blade Runner 2049',
      tmdbId: '335984',
      mediaType: 'movie',
      posterUrl: 'https://example.com/poster.jpg'
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.success) throw new Error('Success flag not set');
    if (!response.body.item) throw new Error('No item returned');
  });
});

tests.push(async () => {
  await test('Watchlist - Get Items', async () => {
    const deviceId = 'test-device-' + Date.now();
    // First add an item
    await makeRequest('POST', API_ENDPOINTS.watchlist, {
      deviceId: deviceId,
      title: 'Inception',
      tmdbId: '27205',
      mediaType: 'movie',
      posterUrl: 'https://example.com/poster.jpg'
    });
    
    // Then retrieve
    const response = await makeRequest('GET', `${API_ENDPOINTS.watchlist}/${deviceId}`);
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.items) throw new Error('No items in response');
  });
});

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Test Suite...\n');
  console.log(`Target: ${BASE_URL}\n`);
  
  for (const testFn of tests) {
    await testFn();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'HEAD',
      timeout: 2000
    }, () => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Main execution
(async () => {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on port 3000');
    console.log('Please start the server with: node server.js');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  await runAllTests();
})();
