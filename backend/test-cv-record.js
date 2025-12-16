// Quick test script to check the failed CV record in MongoDB
const { MongoClient } = require('mongodb');

async function checkFailedCV() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db();
    const cvRecords = database.collection('cvrecords');

    // Find the most recent failed CV
    const failedCV = await cvRecords
      .find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (failedCV.length > 0) {
      console.log('\n===== FAILED CV RECORD =====');
      console.log('ID:', failedCV[0]._id);
      console.log('Filename:', failedCV[0].filename);
      console.log('Status:', failedCV[0].status);
      console.log('Error Message:', failedCV[0].errorMessage);
      console.log('Storage URL:', failedCV[0].storageUrl);
      console.log('MIME Type:', failedCV[0].mimeType);
      console.log('Uploaded At:', failedCV[0].createdAt);
      console.log('Processed At:', failedCV[0].processedAt);
      console.log(
        '\nExtracted Text Length:',
        failedCV[0].extractedText?.length || 0,
      );
      console.log('Has Analysis:', !!failedCV[0].analysis);
      console.log('Score:', failedCV[0].score);
      console.log('============================\n');
    } else {
      console.log('No failed CV records found');
    }

    // Also check all CV records
    const allCVs = await cvRecords
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    console.log('\n===== RECENT CVs (Last 5) =====');
    allCVs.forEach((cv, idx) => {
      console.log(
        `${idx + 1}. ${cv.filename} - Status: ${cv.status} - Score: ${cv.score || 'N/A'}`,
      );
      if (cv.errorMessage) {
        console.log(`   Error: ${cv.errorMessage}`);
      }
    });
    console.log('==============================\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkFailedCV();
