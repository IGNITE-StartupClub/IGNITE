#!/usr/bin/env node
/**
 * Export existing Job Positions before migration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const STRAPI_URL = process.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

async function exportJobPositions() {
  console.log('📥 Exporting Job Positions...\n');

  const url = `${STRAPI_URL}/api/job-positions?populate=*&pagination[pageSize]=100`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Save to file
  const outputPath = join(__dirname, '../backup-job-positions.json');
  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Exported ${data.data.length} positions`);
  console.log(`📁 Saved to: backup-job-positions.json\n`);

  // Display summary
  console.log('Summary:');
  data.data.forEach((pos, i) => {
    console.log(`${i + 1}. ${pos.title} (${pos.team})`);
  });

  return data;
}

exportJobPositions().catch(console.error);
