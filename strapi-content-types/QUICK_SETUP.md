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

## 5. Feature

**Collection Name:** `feature`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| icon | Text (short) | Yes | e.g., "ion:diamond-outline" |
| title | Text (short) | Yes | |
| description | Text (long) | Yes | |
| order | Number (integer) | No | Default: 0 |

## 6. FAQ

**Collection Name:** `faq`

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| question | Text (short) | Yes | |
| answer | Rich Text | Yes | |
| openByDefault | Boolean | No | Default: false |
| order | Number (integer) | No | Default: 0 |

## 7. Questionnaire (IMPORTANT: Single Type!)

**IMPORTANT:** This is a **Single Type**, not a Collection Type!

**Single Type Name:** `questionnaire`

### Step 1: Create Components First

Before creating the Questionnaire, you need to create two components:

#### Component 1: Startup Interest Option

1. Go to **Content-Type Builder**
2. Click **Create new component**
3. Category: `questionnaire` (or choose your own)
4. Component name: `startup-interest-option`
5. Add these fields:

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| value | Text (short) | Yes | e.g., "interested" |
| label | Text (short) | Yes | e.g., "Ich finde Startups spannend" |
| order | Number (integer) | No | Default: 0 |

6. Click **Save**

#### Component 2: Questionnaire Question

1. Click **Create new component**
2. Category: `questionnaire` (same as above)
3. Component name: `questionnaire-question`
4. Add these fields:

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| questionId | Text (short) | Yes | e.g., "q1", "q4", "q5" |
| step | Enumeration | Yes | Values: "3", "4", "5" |
| label | Text (long) | Yes | The actual question text |
| fieldType | Enumeration | Yes | Values: "textarea", "text", "email" (Default: "textarea") |
| rows | Number (integer) | No | Default: 4 |
| placeholder | Text (short) | No | |
| required | Boolean | No | Default: true |
| order | Number (integer) | No | Default: 0 |

5. Click **Save**

### Step 2: Create Questionnaire Single Type

1. In **Content-Type Builder**, click **Create new single type**
2. Enter the **Single Type Name**: `questionnaire`
3. Click **Continue**
4. Add these fields:

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| step1ButtonText | Text (short) | Yes | Default: "Bewerbung ausfüllen" |
| step2Label | Text (short) | Yes | Default: "Wähle 2-3 Teams..." |
| step2MinTeams | Number (integer) | Yes | Default: 2 |
| step2MaxTeams | Number (integer) | Yes | Default: 3 |
| step2HintTooFew | Text (short) | Yes | Default: "Bitte wähle mindestens 2 Teams aus." |
| step2HintMaximum | Text (short) | Yes | Default: "Du hast die maximale Anzahl..." |
| step3QuestionLabel | Text (short) | Yes | Default: "Was beschreibt deine Situation am besten?" |
| step3Options | Component (repeatable) | No | Select: `questionnaire.startup-interest-option` |
| questions | Component (repeatable) | No | Select: `questionnaire.questionnaire-question` |
| step6FirstNameLabel | Text (short) | Yes | Default: "Vorname" |
| step6LastNameLabel | Text (short) | Yes | Default: "Nachname" |
| step6EmailLabel | Text (short) | Yes | Default: "E-Mail" |

5. Click **Save**

---

## Step-by-Step Creation Process

For each **Collection Type** (1-6):

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

For **Questionnaire (Single Type #7)**, follow the special instructions above!

Repeat for all content types.

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
| Enumeration | Enumeration |
| Component (repeatable) | Component → Repeatable component |

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
