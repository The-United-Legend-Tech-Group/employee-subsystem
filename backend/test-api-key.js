const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA';

async function testApiKey() {
  console.log('Testing API Key...');
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Try different model names
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n--- Testing: ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(
        'Say "test successful" if you can read this.',
      );
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS with ${modelName}`);
      console.log(`Response: ${text.substring(0, 100)}`);
      break; // Stop on first success
    } catch (error) {
      console.log(`❌ FAILED with ${modelName}`);
      console.log(`Error: ${error.message}`);
    }
  }
}

testApiKey();
