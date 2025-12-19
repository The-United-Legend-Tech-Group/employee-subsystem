// Test the entire ATS processing flow
const fs = require('fs').promises;
const pdf = require('pdf-parse');

const filePath = 'src/Recruitment/ats/cv/1765869491793-Youssef-Ashraf.pdf';

async function testATSFlow() {
  try {
    console.log('=== Step 1: Reading PDF ===');
    const dataBuffer = await fs.readFile(filePath);
    console.log('File size:', dataBuffer.length, 'bytes');

    console.log('\n=== Step 2: Extracting text ===');
    const data = await pdf(dataBuffer);
    console.log('Extracted text length:', data.text.length, 'characters');
    console.log('Text preview (first 200 chars):', data.text.substring(0, 200));

    console.log('\n=== Step 3: Testing Gemini API ===');
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    const apiKey =
      process.env.GOOGLE_GEMINI_API_KEY ||
      'AIzaSyCXs1zV8qIVa-c8QJLu0MeKuGG4dt-N9SA';
    console.log('API Key:', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try gemini-pro (more widely available)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this CV text and return a JSON response with an overallScore (0-100):

CV Text:
${data.text.substring(0, 1000)}

Return only valid JSON with at least: {"overallScore": 75}`;

    console.log('\nSending to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log('\n=== Gemini Response ===');
    console.log(responseText.substring(0, 500));

    console.log('\n=== SUCCESS: All steps completed ===');
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testATSFlow();
