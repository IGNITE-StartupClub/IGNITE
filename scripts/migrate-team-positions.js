#!/usr/bin/env node
/**
 * Migration script to import team positions from local data to Strapi
 * Run with: node scripts/migrate-team-positions.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const STRAPI_URL = process.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN not found in .env file');
  process.exit(1);
}

// Import local job positions data
const teams = [
  {
    id: 'ignite-events',
    image: '',
    category: 'extern',
    team: 'IGNITE Events',
    title: 'Events Team',
    description: 'Organisiert Workshops, Hackathons, Startup-Breakfasts und Networking-Events. Verantwortlich für alle öffentlichen Veranstaltungen und Community-Building.',
  },
  {
    id: 'ignite-relations',
    image: '',
    category: 'extern',
    team: 'IGNITE Relations & Cooperations',
    title: 'Relations Team',
    description: 'Baut Kontakte zu Organisationen, Unternehmen und dem Advisory Board Mitgliedern auf. Koordiniert Partnerschaften und externe Beziehungen.',
  },
  {
    id: 'ignite-marketing',
    image: '',
    category: 'extern',
    team: 'IGNITE Marketing',
    title: 'Marketing Team',
    description: 'Sorgt für Sichtbarkeit durch Social Media, Website, Newsletter und physische Präsenz an der Uni. Erstellt Content und Werbematerial.',
  },
  {
    id: 'ignite-hr',
    image: '',
    category: 'intern',
    team: 'IGNITE Human Resources',
    title: 'HR Team',
    description: 'Organisiert Recruiting, Bewerbungsgespräche und Teambuilding. Ansprechpartner für interne Themen und Meetings.',
  },
  {
    id: 'ignite-finance-legal',
    image: '',
    category: 'intern',
    team: 'IGNITE Finance & Legal',
    title: 'Finance & Legal Team',
    description: 'Kümmert sich um Vereinsgründung, Buchhaltung, Budgetierung und Sponsorings. Verwaltet rechtliche und finanzielle Angelegenheiten.',
  },
  {
    id: 'ignite-quality-control',
    image: '',
    category: 'intern',
    team: 'IGNITE Quality & Control',
    title: 'Process & Tools Team',
    description: 'Wählt Tools aus, verwaltet Accounts und optimiert interne Arbeitsabläufe. Sorgt für effiziente Zusammenarbeit im Team.',
  },
];

async function createTeamPosition(position, order) {
  const url = `${STRAPI_URL}/api/team-positions`;

  const data = {
    data: {
      team: position.team,
      title: position.title,
      description: position.description,
      category: position.category,
      isActive: true,
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

async function main() {
  console.log('🚀 Starting migration of team positions to Strapi...\n');
  console.log(`📍 Strapi URL: ${STRAPI_URL}`);
  console.log(`📊 Positions to migrate: ${teams.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < teams.length; i++) {
    const position = teams[i];
    const result = await createTeamPosition(position, i + 1);

    if (result) {
      successCount++;
    } else {
      failCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log(`\n📝 Next steps:`);
    console.log(`1. Visit ${STRAPI_URL}/admin to view and edit the team positions`);
    console.log(`2. Add images to the positions if needed`);
    console.log(`3. Rebuild your website to fetch the new data`);
  }
}

main().catch(console.error);
