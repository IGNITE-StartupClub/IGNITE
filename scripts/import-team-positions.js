#!/usr/bin/env node
/**
 * Import Team Positions from backup
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const STRAPI_URL = process.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

async function createTeamPosition(position, order) {
  const url = `${STRAPI_URL}/api/team-positions`;

  const data = {
    data: {
      team: position.team,
      title: position.title,
      description: position.description,
      category: position.category,
      isActive: position.isActive,
      order: order,
      publishedAt: new Date().toISOString()
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Created: ${position.title}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create ${position.title}:`, error.message);
    return null;
  }
}

async function importTeamPositions() {
  console.log('📤 Importing Team Positions...\n');

  // Load backup
  const backupPath = join(__dirname, '../backup-job-positions.json');
  const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

  console.log(`📊 Found ${backup.data.length} positions to import\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < backup.data.length; i++) {
    const position = backup.data[i];
    const result = await createTeamPosition(position, i + 1);

    if (result) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Import complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log(`\n📝 Next steps:`);
    console.log(`1. Visit ${STRAPI_URL}/admin to verify the team positions`);
    console.log(`2. Delete the old 'Job Position' content type`);
    console.log(`3. Your website will now use the new 'Team Position' data`);
  }
}

importTeamPositions().catch(console.error);
