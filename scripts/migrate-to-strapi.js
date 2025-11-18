/**
 * Migration Script: Import existing IGNITE content into Strapi
 *
 * This script migrates:
 * - Advisory Board Members (from AdvisoryBoard.jsx)
 * - Partners (from PartnersStrapi.astro)
 * - News Articles (from src/content/projects/*.md)
 * - Events (from src/content/events/*.md)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_URL = process.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN not found in .env file!');
  console.error('Please create an API token in Strapi dashboard and add it to your .env file');
  process.exit(1);
}

// Helper function to parse markdown frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const data = {};
  const lines = frontmatter.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, content: body };
}

// API helper functions
async function createStrapiEntry(contentType, data) {
  const url = `${STRAPI_URL}/api/${contentType}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error creating ${contentType}:`, error.message);
    throw error;
  }
}

async function uploadImage(imagePath) {
  // If it's a URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log(`   ℹ️  External URL: ${imagePath} (will need manual upload)`);
    return null;
  }

  // Check if it's a local file
  const fullPath = path.join(__dirname, '..', 'public', imagePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  Image not found: ${imagePath}`);
    return null;
  }

  try {
    const formData = new FormData();
    const fileContent = fs.readFileSync(fullPath);
    const blob = new Blob([fileContent]);
    formData.append('files', blob, path.basename(imagePath));

    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result[0].id;
  } catch (error) {
    console.log(`   ⚠️  Could not upload ${imagePath}: ${error.message}`);
    return null;
  }
}

// Migration functions
async function migrateAdvisoryBoard() {
  console.log('\n📋 Migrating Advisory Board Members...');

  const advisoryMembers = [
    {
      name: 'Prof. Dr. Markus Reihlen',
      title: 'Professor für Strategisches Management & Entrepreneurship',
      department: 'Vizepräsident Entrepreneurship, Transfer & Internationalisierung',
      boardRole: 'Schirmherrschaft',
      bio: 'Experte für Strategisches Management und Innovation',
      linkedin: 'https://www.linkedin.com/in/markus-reihlen-10594940/',
      image: 'https://www.leuphana.de/fileadmin/_processed_/6/5/csm_reihlen_markus__795-70697.690x690px.WEB_944517a3d2.jpg',
      initials: 'MR',
      order: 1
    },
    {
      name: 'Prof. Dr. Burkhardt Funk',
      title: 'Professor für Wirtschaftsinformatik und Data Science',
      department: 'Leuphana Universität Lüneburg',
      boardRole: 'Advisory Board Member',
      bio: 'Experte für datengetriebene Services und maschinelles Lernen',
      linkedin: 'https://www.linkedin.com/in/burkhardt-funk-779361126/?originalSubdomain=de',
      image: '/img/advisory/burkhardt_funk_zg.jpg',
      initials: 'BF',
      order: 2
    },
    {
      name: 'Prof. Dr. Elke Schüßler',
      title: 'Professorin für Betriebswirtschaftslehre, insbesondere Entrepreneurship und Organisation',
      department: 'Leuphana Universität Lüneburg',
      boardRole: 'Advisory Board Member',
      bio: 'Expertin für nachhaltige Organisations- und Arbeitsformen',
      linkedin: 'https://www.linkedin.com/in/elke-schuessler-01a488a/?originalSubdomain=de',
      image: 'https://www.leuphana.de/fileadmin/_processed_/9/1/csm_schuessler_elke_795-81159.690x690px.WEB_cee730c75f.jpg',
      initials: 'ES',
      order: 3
    },
    {
      name: 'Prof. Dr. Matthias Wenzel',
      title: 'Professor für Organisation',
      department: 'Leuphana Universität Lüneburg',
      boardRole: 'Advisory Board Member',
      bio: 'Experte für das Zusammenspiel von Organisation und Strategie aus praxistheoretischer Perspektive sowie deren gesellschaftliche Implikationen',
      linkedin: '',
      image: 'https://www.leuphana.de/fileadmin/_processed_/c/0/csm_wenzel_matthias_87f76fcb0c.jpg',
      initials: 'MW',
      order: 4
    }
  ];

  for (const member of advisoryMembers) {
    try {
      // For external URLs, we'll store them as text and handle manually
      const memberData = { ...member };
      if (member.image && member.image.startsWith('http')) {
        console.log(`   ℹ️  ${member.name}: External image URL (will need manual upload)`);
        // Remove image field for now - user will upload manually
        delete memberData.image;
      } else if (member.image) {
        const imageId = await uploadImage(member.image);
        if (imageId) {
          memberData.image = imageId;
        } else {
          delete memberData.image;
        }
      }

      await createStrapiEntry('advisory-board-members', memberData);
      console.log(`   ✅ ${member.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${member.name}:`, error.message);
    }
  }
}

async function migratePartners() {
  console.log('\n🤝 Migrating Partners...');

  const partners = [
    {
      name: "Utopia Lüneburg",
      logo: "/img/partners/utopia.svg",
      url: "https://partner1.com",
      order: 1
    },
    {
      name: "START Hamburg",
      logo: "/img/partners/starthh.png",
      url: "https://partner2.com",
      order: 2
    }
  ];

  for (const partner of partners) {
    try {
      const logoId = await uploadImage(partner.logo);
      const partnerData = { ...partner };

      if (logoId) {
        partnerData.logo = logoId;
      } else {
        console.log(`   ⚠️  ${partner.name}: Logo needs manual upload`);
        delete partnerData.logo;
      }

      await createStrapiEntry('partners', partnerData);
      console.log(`   ✅ ${partner.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${partner.name}:`, error.message);
    }
  }
}

async function migrateNewsArticles() {
  console.log('\n📰 Migrating News Articles...');

  const projectsDir = path.join(__dirname, '..', 'src', 'content', 'projects');

  if (!fs.existsSync(projectsDir)) {
    console.log('   ⚠️  Projects directory not found');
    return;
  }

  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    try {
      const filePath = path.join(projectsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = parseFrontmatter(content);

      const slug = file.replace('.md', '');

      const articleData = {
        title: data.title,
        slug: slug,
        description: data.description,
        content: body.trim(),
        author: data.author,
        date: data.date,
        isFeatured: false
      };

      if (data.image) {
        const imageId = await uploadImage(data.image);
        if (imageId) {
          articleData.image = imageId;
        }
      }

      await createStrapiEntry('news-articles', articleData);
      console.log(`   ✅ ${data.title}`);
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${file}:`, error.message);
    }
  }
}

async function migrateEvents() {
  console.log('\n📅 Migrating Events...');

  const eventsDir = path.join(__dirname, '..', 'src', 'content', 'events');

  if (!fs.existsSync(eventsDir)) {
    console.log('   ⚠️  Events directory not found');
    return;
  }

  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    try {
      const filePath = path.join(eventsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = parseFrontmatter(content);

      const slug = file.replace('.md', '');

      const eventData = {
        title: data.title,
        slug: slug,
        description: data.description,
        content: body.trim(),
        date: data.date,
        time: data.time,
        author: data.author,
        author_title: data.author_title,
        register_url: data.register_url,
        isFeatured: false
      };

      if (data.image) {
        const imageId = await uploadImage(data.image);
        if (imageId) {
          eventData.image = imageId;
        }
      }

      if (data.avatar) {
        const avatarId = await uploadImage(data.avatar);
        if (avatarId) {
          eventData.avatar = avatarId;
        }
      }

      await createStrapiEntry('events', eventData);
      console.log(`   ✅ ${data.title}`);
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${file}:`, error.message);
    }
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting IGNITE Content Migration to Strapi');
  console.log(`📡 Strapi URL: ${STRAPI_URL}`);

  try {
    // Test connection
    console.log('\n🔍 Testing Strapi connection...');
    // Use a content endpoint instead of /users/me since API tokens don't work with that endpoint
    const testResponse = await fetch(`${STRAPI_URL}/api/advisory-board-members`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`Failed to connect to Strapi (${testResponse.status}): ${errorText}`);
    }

    console.log('✅ Connected to Strapi successfully!');

    // Run migrations
    await migrateAdvisoryBoard();
    await migratePartners();
    await migrateNewsArticles();
    await migrateEvents();

    console.log('\n✨ Migration completed!');
    console.log('\n📝 Note: Images from external URLs need to be uploaded manually in Strapi dashboard');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
