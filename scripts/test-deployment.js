// Test script to verify deployment
import fetch from 'node-fetch';

const BASE_URL = 'https://aibotwizard.vercel.app';

async function testDeployment() {
  console.log('🧪 Testing chatbot widget deployment...\n');

  const tests = [
    {
      name: 'Main page accessibility',
      url: BASE_URL,
      expectedStatus: 200
    },
    {
      name: 'Widget script accessibility',
      url: `${BASE_URL}/chatbot-widget.min.js`,
      expectedStatus: 200
    },
    {
      name: 'Chatbot embed page',
      url: `${BASE_URL}/chatbot-embed`,
      expectedStatus: 200
    },
    {
      name: 'API settings endpoint',
      url: `${BASE_URL}/api/chatbot/settings`,
      expectedStatus: 401 // Should return 401 without API key
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED (${response.status})`);
      } else {
        console.log(`❌ ${test.name}: FAILED (expected ${test.expectedStatus}, got ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }

  console.log('🎉 Deployment test completed!');
  console.log('\nNext steps:');
  console.log('1. Test the widget on a real website');
  console.log('2. Verify API connections work with your API key');
  console.log('3. Check Socket.IO connections');
  console.log('4. Test instant replies functionality');
}

testDeployment().catch(console.error);
