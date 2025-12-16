// Test listing available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA';

async function listModels() {
  try {
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('\nAttempting to list models...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('\nAvailable models:');
    for (const model of models) {
      console.log(`- ${model.name} (${model.displayName})`);
    }
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('\nThis usually means:');
    console.error('1. The API key is invalid or expired');
    console.error('2. The API key doesn\'t have Gemini API enabled');
    console.error('3. Network/firewall issue');
    console.error('\nPlease:');
    console.error('- Visit: https://makersuite.google.com/app/apikey');
    console.error('- Create a new API key');
    console.error('- Ensure "Generative Language API" is enabled');
  }
}

listModels();
