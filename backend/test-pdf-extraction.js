const fs = require('fs').promises;
const pdf = require('pdf-parse');

const filePath = 'src/Recruitment/ats/cv/1765869491793-Youssef-Ashraf.pdf';

async function testPDF() {
  try {
    console.log('Reading PDF file:', filePath);
    const dataBuffer = await fs.readFile(filePath);
    console.log('File read successfully. Size:', dataBuffer.length, 'bytes');
    
    console.log('Parsing PDF...');
    const data = await pdf(dataBuffer);
    
    console.log('\n=== PDF EXTRACTION SUCCESSFUL ===');
    console.log('Text length:', data.text.length, 'characters');
    console.log('Number of pages:', data.numpages);
    console.log('\n=== First 500 characters ===');
    console.log(data.text.substring(0, 500));
    console.log('\n=== Last 200 characters ===');
    console.log(data.text.substring(data.text.length - 200));
  } catch (error) {
    console.error('\n=== PDF EXTRACTION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDF();
