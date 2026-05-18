const http = require('http');

function makeRequest(path, tier) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'X-User-Tier': tier
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, data: `Error: ${e.message}` });
    });

    req.end();
  });
}

async function runTests() {
  console.log("Testing Free Tier on AI Endpoint (Limit is 5 requests per minute)...\n");

  for (let i = 1; i <= 6; i++) {
    const response = await makeRequest('/ai/generate', 'free');

    if (response.status === 200) {
      console.log(`Request ${i}: ✅ Success (Status 200) -> Allowed!`);
    } else if (response.status === 429) {
      console.log(`Request ${i}: ❌ Rate Limited (Status 429) -> Blocked!`);
      console.log(`   Response JSON: ${response.data}`);
    } else if (response.status === 0) {
      console.log(`Make sure your server is running using 'npm start'!`);
      return;
    }
  }

  console.log("\nIf you look at Request 6, you'll see it correctly returns the 429 error and tells you how many seconds to retry after!");
}

runTests();
