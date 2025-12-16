// Test Gemini API directly with HTTP request
const https = require('https');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA';

async function testGeminiAPI() {
  console.log('API Key:', apiKey.substring(0, 15) + '...');
  
  // Try the most commonly available model names
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash',
  ];
  
  for (const model of modelsToTry) {
    console.log(`\n--- Testing model: ${model} ---`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const data = JSON.stringify({
      contents: [{
        parts: [{
          text: 'Say hello in one word'
        }]
      }]
    });
    
    try {
      const response = await makeRequest(url, data);
      console.log('✅ SUCCESS! Model works!');
      console.log('Response preview:', response.substring(0, 150));
      console.log(`\n🎉 Use this model name in your code: "${model}"`);
      break;
    } catch (error) {
      console.log('❌ Failed:', error.message.substring(0, 100));
    }
  }
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseBody);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

testGeminiAPI();
