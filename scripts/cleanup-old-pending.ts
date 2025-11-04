/**
 * Cleanup Script for Old Pending Email Confirmations
 *
 * This script removes all pending email confirmations older than 24 hours
 * from the MongoDB database. It should be run once to clean up existing
 * old entries before the automatic TTL index takes effect.
 *
 * Usage: npx tsx scripts/cleanup-old-pending.ts
 */

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

async function cleanupOldPendingConfirmations() {
  console.log('Starting cleanup of old pending confirmations...');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGO_DB);
    const collection = db.collection('pending_confirmations');

    // Calculate the cutoff date (24 hours ago)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

    // Find all pending confirmations older than 24 hours
    const oldEntries = await collection.find({
      createdAt: { $lt: cutoffDate }
    }).toArray();

    console.log(`Found ${oldEntries.length} old pending confirmations`);

    if (oldEntries.length > 0) {
      // Delete old entries
      const result = await collection.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      console.log(`Deleted ${result.deletedCount} old pending confirmations`);
    } else {
      console.log('No old entries to delete');
    }

    // Show remaining pending confirmations count
    const remainingCount = await collection.countDocuments();
    console.log(`Remaining pending confirmations: ${remainingCount}`);

    // Verify TTL index exists
    const indexes = await collection.indexes();
    const ttlIndex = indexes.find(idx =>
      idx.key?.createdAt === 1 && idx.expireAfterSeconds !== undefined
    );

    if (ttlIndex) {
      console.log(`✓ TTL index found: expires after ${ttlIndex.expireAfterSeconds} seconds`);
    } else {
      console.log('⚠ Warning: TTL index not found. Make sure to restart the application to create it.');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Cleanup complete. MongoDB connection closed.');
  }
}

// Run the cleanup
cleanupOldPendingConfirmations()
  .then(() => {
    console.log('\n✓ Cleanup successfully completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Cleanup failed:', error);
    process.exit(1);
  });
