/**
 * Migration script to fix position schema index issue
 * This script:
 * 1. Removes documents with null code/positionCode
 * 2. Drops the old positionCode_1 index
 * 3. Creates the correct code_1 index
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixPositionIndex() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri);

        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const positionsCollection = db.collection('positions');

        // 1. Delete documents with null code or positionCode
        console.log('\n1. Removing documents with null code/positionCode...');
        const deleteResult = await positionsCollection.deleteMany({
            $or: [
                { code: null },
                { code: { $exists: false } },
                { positionCode: null }
            ]
        });
        console.log(`   Deleted ${deleteResult.deletedCount} document(s) with null code`);

        // 2. Check existing indexes
        console.log('\n2. Current indexes:');
        const indexes = await positionsCollection.indexes();
        indexes.forEach(index => {
            console.log(`   - ${JSON.stringify(index.key)}: ${index.name}`);
        });

        // 3. Drop the old positionCode_1 index if it exists
        console.log('\n3. Dropping old positionCode_1 index...');
        try {
            await positionsCollection.dropIndex('positionCode_1');
            console.log('   Successfully dropped positionCode_1 index');
        } catch (error) {
            if (error.code === 27 || error.message.includes('index not found')) {
                console.log('   Index positionCode_1 does not exist (already dropped)');
            } else {
                throw error;
            }
        }

        // 4. Create the correct code_1 unique index
        console.log('\n4. Creating code_1 unique index...');
        try {
            await positionsCollection.createIndex({ code: 1 }, { unique: true, name: 'code_1' });
            console.log('   Successfully created code_1 index');
        } catch (error) {
            if (error.code === 85 || error.message.includes('already exists')) {
                console.log('   Index code_1 already exists');
            } else {
                throw error;
            }
        }

        // 5. Show final indexes
        console.log('\n5. Final indexes:');
        const finalIndexes = await positionsCollection.indexes();
        finalIndexes.forEach(index => {
            console.log(`   - ${JSON.stringify(index.key)}: ${index.name}`);
        });

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

fixPositionIndex();
