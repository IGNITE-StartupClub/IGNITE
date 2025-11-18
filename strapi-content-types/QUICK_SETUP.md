# Quick Strapi Content Types Setup

Use this guide to manually create content types in Strapi Dashboard.

## 1. Advisory Board Member

**Collection Name:** `advisory-board-member`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| name | Text (short) | Yes | |
| title | Text (short) | Yes | |
| department | Text (short) | No | |
| boardRole | Text (short) | Yes | |
| bio | Text (long) | No | |
| linkedin | Text (short) | No | |
| image | Media (single) | No | Images only |
| initials | Text (short) | No | Max 3 characters |
| order | Number (integer) | No | Default: 0 |

## 2. Partner

**Collection Name:** `partner`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| name | Text (short) | Yes | |
| logo | Media (single) | Yes | Images only |
| url | Text (short) | No | |
| description | Text (long) | No | |
| order | Number (integer) | No | Default: 0 |

## 3. News Article

**Collection Name:** `news-article`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| title | Text (short) | Yes | |
| slug | UID | Yes | Target field: title |
| description | Text (long) | Yes | |
| content | Rich Text | No | |
| image | Media (single) | No | Images only |
| author | Text (short) | No | |
| date | Date | Yes | |
| tags | JSON | No | |
| isFeatured | Boolean | No | Default: false |

## 4. Event

**Collection Name:** `event`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| title | Text (short) | Yes | |
| slug | UID | Yes | Target field: title |
| description | Text (long) | Yes | |
| content | Rich Text | No | |
| date | Date | Yes | |
| time | Text (short) | Yes | e.g., "18:00" |
| location | Text (short) | No | |
| image | Media (single) | No | Images only |
| author | Text (short) | No | |
| author_title | Text (short) | No | |
| avatar | Media (single) | No | Images only |
| register_url | Text (short) | No | |
| isFeatured | Boolean | No | Default: false |

---

## Step-by-Step Creation Process

For each content type above:

1. In Strapi Dashboard, go to **Content-Type Builder**
2. Click **Create new collection type**
3. Enter the **Collection Name** (e.g., `advisory-board-member`)
4. Click **Continue**
5. For each field in the table:
   - Click **Add another field**
   - Select the field **Type** from the table
   - Enter the **Field Name** exactly as shown
   - Configure **Required** based on the table
   - Set any defaults mentioned in **Notes**
   - Click **Finish**
6. After adding all fields, click **Save**
7. Wait for Strapi to restart

Repeat for all 4 content types.

---

## Field Type Reference

| Our Name | Strapi Name |
|----------|-------------|
| Text (short) | Text → Short text |
| Text (long) | Text → Long text |
| Rich Text | Rich text (Markdown) |
| Media (single) | Media → Single media |
| Number (integer) | Number → integer |
| Date | Date → date |
| Boolean | Boolean |
| JSON | JSON |
| UID | UID |

---

## After Creating Content Types

1. Enable public read access for each content type:
   - Go to **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
   - Enable `find` and `findOne` for each content type
   - Save

2. Create your API token:
   - Go to **Settings** → **API Tokens**
   - Create new token with **Full access**
   - Copy the token to your `.env` file

3. Run the migration:
   ```bash
   npm run migrate:strapi
   ```

That's it! Your content will be migrated automatically.
