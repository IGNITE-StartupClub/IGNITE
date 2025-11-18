# IGNITE Content Migration to Strapi

This guide will help you migrate all existing IGNITE website content into your Strapi CMS.

## What Gets Migrated

This migration script will automatically import:

- **Advisory Board Members** (4 members from `AdvisoryBoard.jsx`)
- **Partners** (2 partners from `PartnersStrapi.astro`)
- **News Articles** (from `src/content/projects/*.md`)
- **Events** (from `src/content/events/*.md`)

## Prerequisites

1. **Strapi must be running** on `http://localhost:1337` (or your configured URL)
2. **API Token** - You need a Strapi API token with full permissions

## Step-by-Step Migration Process

### Step 1: Create Content Types in Strapi

Before running the migration, you need to create the content types in Strapi:

#### Option A: Manual Creation (Recommended for first-time users)

1. Log into your Strapi dashboard at `http://localhost:1337/admin`
2. Navigate to **Content-Type Builder** (in the left sidebar)
3. Create each content type following the schemas in `strapi-content-types/`:

**For each content type:**
- Click **"Create new collection type"**
- Enter the name (e.g., "Advisory Board Member")
- Add fields according to the schema files:
  - `advisory-board-member.json`
  - `partner.json`
  - `news-article.json`
  - `event.json`

**Field Types Reference:**
- `string` → Text (short)
- `text` → Text (long)
- `richtext` → Rich Text
- `date` → Date
- `boolean` → Boolean
- `integer` → Number (integer)
- `media` → Media (single)
- `uid` → UID

4. Click **Save** for each content type
5. Strapi will restart automatically

#### Option B: Programmatic Creation (Advanced)

The content type schemas are in `strapi-content-types/` folder. You can:
1. Copy these schema files into your Strapi project
2. Place them in `src/api/<content-type-name>/content-types/<content-type-name>/schema.json`
3. Restart Strapi

### Step 2: Generate API Token

1. In Strapi dashboard, go to **Settings** → **API Tokens**
2. Click **"Create new API Token"**
3. Configure:
   - **Name**: "Migration Token" (or any name you prefer)
   - **Token duration**: Custom (or as needed)
   - **Token type**: Full access
4. Click **Save**
5. **Copy the token** (you'll only see it once!)

### Step 3: Configure Environment Variables

Add your Strapi API token to your `.env` file:

```env
PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your_copied_token_here
```

### Step 4: Run the Migration

Execute the migration script:

```bash
node scripts/migrate-to-strapi.js
```

The script will:
1. Test the connection to Strapi
2. Migrate all advisory board members
3. Migrate all partners
4. Migrate all news articles from markdown files
5. Migrate all events from markdown files

### Step 5: Manual Image Upload (if needed)

Some images (especially external URLs) cannot be automatically uploaded. You'll see warnings like:

```
ℹ️  External URL: https://... (will need manual upload)
```

For these:
1. Go to Strapi dashboard
2. Navigate to the content type (e.g., "Advisory Board Members")
3. Edit the entry
4. Download the image from the URL
5. Upload it manually in Strapi

## Expected Output

You should see output like:

```
🚀 Starting IGNITE Content Migration to Strapi
📡 Strapi URL: http://localhost:1337

🔍 Testing Strapi connection...
✅ Connected to Strapi successfully!

📋 Migrating Advisory Board Members...
   ✅ Prof. Dr. Markus Reihlen
   ✅ Prof. Dr. Burkhardt Funk
   ✅ Prof. Dr. Elke Schüßler
   ✅ Prof. Dr. Matthias Wenzel

🤝 Migrating Partners...
   ✅ Utopia Lüneburg
   ✅ START Hamburg

📰 Migrating News Articles...
   ✅ Kick-off von IGNITE
   ✅ Cheftreff
   ✅ START Besuch

📅 Migrating Events...
   ✅ How2Pitch

✨ Migration completed!
```

## Verification

After migration, verify in Strapi dashboard:

1. Go to **Content Manager**
2. Check each content type:
   - Advisory Board Members (should have 4 entries)
   - Partners (should have 2 entries)
   - News Articles (should match your markdown files)
   - Events (should match your markdown files)

## Publishing Content

By default, new entries are created as **drafts**. To make them visible:

1. Go to **Content Manager**
2. Select the content type
3. For each entry, click **Publish**

Or use **Bulk Publish** to publish all at once.

## Troubleshooting

### "STRAPI_TOKEN not found"
- Make sure you added the token to `.env` file
- Restart your terminal/IDE after adding the token

### "Failed to connect to Strapi"
- Ensure Strapi is running (`npm run develop` in Strapi folder)
- Check the URL in `.env` matches your Strapi instance
- Verify the API token is valid

### "Content type not found"
- Make sure you created all content types in Step 1
- The API names must match exactly:
  - `advisory-board-members`
  - `partners`
  - `news-articles`
  - `events`

### Migration runs but no content appears
- Check that entries are **published** (not just saved as drafts)
- Verify you're looking in the right content type in Content Manager

## Next Steps

After successful migration:

1. **Update your website components** to fetch from Strapi instead of hardcoded data
2. **Test the Strapi loaders** in `src/lib/strapi/loaders.ts`
3. **Remove hardcoded data** from components once you verify Strapi is working

## Re-running Migration

⚠️ **Warning**: Running the migration again will create duplicate entries. If you need to re-run:

1. Delete all entries from Strapi dashboard first
2. Or modify the script to check for existing entries

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Check Strapi logs for API errors
4. Review the `STRAPI_CMS_GUIDE.md` for additional Strapi setup help
