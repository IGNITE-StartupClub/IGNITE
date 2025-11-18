# IGNITE CMS - Strapi Integration Guide

## Übersicht

Das IGNITE CMS basiert auf Strapi, einem Open-Source Headless CMS. Diese Dokumentation erklärt, wie das CMS lokal gestartet, Inhalte gepflegt und in Produktion deployed wird.

## Projektstruktur

```
IGNITE CI/Website/
├── IGNITE/                    # Frontend (Astro)
│   ├── src/
│   │   ├── lib/strapi/       # Strapi API Client
│   │   └── components/        # UI Komponenten (mit Strapi-Varianten)
│   └── .env                   # Frontend Umgebungsvariablen
└── ignite-cms/                # Backend (Strapi)
    ├── src/api/              # Content Types
    ├── config/               # Strapi Konfiguration
    └── .env                  # Backend Umgebungsvariablen
```

## Lokale Entwicklung

### 1. Strapi Backend starten

```bash
cd "IGNITE CI/Website/ignite-cms"
npm run develop
```

Das Admin-Panel ist dann unter `http://localhost:1337/admin` erreichbar.

**Beim ersten Start:**
1. Ein Admin-Account wird erstellt (E-Mail, Passwort wählen)
2. Die Content-Types werden automatisch registriert
3. Du kannst sofort mit der Inhaltspflege beginnen

### 2. Frontend starten

```bash
cd "IGNITE CI/Website/IGNITE"
npm run dev
```

Das Frontend läuft unter `http://localhost:4321`.

## Content Types

### Team Member
- **Felder:** Name, Position (Array), Foto, Beschreibung, LinkedIn, E-Mail, Team-Zugehörigkeit
- **Verwendung:** Team-Seite, About-Section

### Team
- **Felder:** Name, Beschreibung, Members (Relation)
- **Verwendung:** Gruppierung von Team-Mitgliedern (Vorstand, Community, etc.)

### Advisory Board Member
- **Felder:** Name, Titel, Department, Board-Rolle, Bio, LinkedIn, Bild, Initialen
- **Verwendung:** Advisory Board Sektion

### Job Position
- **Felder:** Team, Titel, Beschreibung, Kategorie (intern/extern), Bild, Aktiv-Status
- **Verwendung:** Mitmachen-Seite, offene Positionen

### Partner
- **Felder:** Name, Logo, URL, Beschreibung
- **Verwendung:** Partner-Sektion

### Event
- **Felder:** Titel, Slug, Beschreibung, Content, Datum, Zeit, Location, Bild, Autor, Avatar, Registrierungs-URL
- **Verwendung:** Events-Seite, Kalender

### News Article
- **Felder:** Titel, Slug, Beschreibung, Content, Bild, Autor, Datum, Tags
- **Verwendung:** News/Blog-Seite

## Inhalte verwalten

### Neuen Inhalt erstellen

1. Öffne `http://localhost:1337/admin`
2. Klicke auf "Content Manager" in der Sidebar
3. Wähle den gewünschten Content Type
4. Klicke "Create new entry"
5. Fülle alle Felder aus
6. Klicke "Save" und dann "Publish"

### Bilder hochladen

1. Im Content-Formular auf das Bild-Feld klicken
2. "Add new assets" wählen
3. Datei hochladen oder per Drag & Drop
4. Nach dem Upload "Finish" klicken

### Reihenfolge ändern

Jeder Content Type hat ein `order` Feld. Niedrigere Zahlen erscheinen zuerst.

### Entwürfe speichern

- **Save**: Speichert als Entwurf (nicht öffentlich)
- **Publish**: Veröffentlicht den Inhalt

## API-Zugriff konfigurieren

### Öffentlichen Zugriff erlauben

1. Gehe zu Settings → Users & Permissions Plugin → Roles
2. Klicke auf "Public"
3. Erweitere jeden Content Type
4. Aktiviere "find" und "findOne"
5. Speichern

### API Token erstellen (für Produktion)

1. Gehe zu Settings → API Tokens
2. "Create new API Token"
3. Name: "Frontend Access"
4. Token Type: "Read-only"
5. Token kopieren und im Frontend `.env` einfügen

## Frontend Integration

### Komponenten verwenden

**Astro (SSG - empfohlen):**
```astro
---
import { loadAdvisoryBoardData } from '../lib/strapi/loaders';

const members = await loadAdvisoryBoardData() || fallbackData;
---

<div>
  {members.map(member => (
    <MemberCard member={member} />
  ))}
</div>
```

**React (Client-Side):**
```jsx
import AdvisoryBoardStrapi from './AdvisoryBoardStrapi';

// Daten werden zur Laufzeit geladen
<AdvisoryBoardStrapi />
```

### API Client verwenden

```typescript
import { getEvents, getPartners, getStrapiMediaUrl } from '../lib/strapi/client';

// Alle Events laden
const events = await getEvents();

// Nur 3 Events laden
const events = await getEvents(3);

// Bild-URL erhalten
const imageUrl = getStrapiMediaUrl(event.image);
```

## Deployment auf Strapi Cloud

### 1. Strapi Cloud Account erstellen

1. Gehe zu https://cloud.strapi.io
2. Account erstellen / anmelden
3. "Create Project" klicken

### 2. Git Repository verknüpfen

1. Push den `ignite-cms` Ordner zu GitHub
2. In Strapi Cloud: Repository auswählen
3. Branch: `main`
4. Base directory: `/` (oder Pfad zum cms-Ordner)

### 3. Environment Variables setzen

In Strapi Cloud Dashboard:
- `DATABASE_CLIENT`: postgres (automatisch)
- `APP_KEYS`: (automatisch generiert)
- `JWT_SECRET`: (automatisch generiert)

### 4. Frontend konfigurieren

In Netlify / deinem Hosting:
```
PUBLIC_STRAPI_URL=https://your-project.strapi.cloud
STRAPI_TOKEN=your_api_token
```

### 5. Webhooks für Auto-Rebuild

In Strapi Cloud → Webhooks:
1. Webhook erstellen
2. URL: Netlify Build Hook URL
3. Events: Entry create/update/delete

## Fallback-Strategie

Die Komponenten sind so gebaut, dass sie bei Nichtverfügbarkeit des CMS auf lokale Daten zurückgreifen:

```typescript
const members = await loadAdvisoryBoardData();

if (!members) {
  // Verwendet fallback Daten aus Code
  return fallbackMembers;
}
```

## Troubleshooting

### CORS Fehler

Strapi erlaubt standardmäßig nur bestimmte Origins. Prüfe `config/middlewares.js`:

```javascript
{
  name: 'strapi::cors',
  config: {
    origin: ['http://localhost:4321', 'https://your-domain.com']
  }
}
```

### 403 Forbidden

API-Berechtigungen nicht gesetzt. Siehe "Öffentlichen Zugriff erlauben".

### Bilder werden nicht angezeigt

- Prüfe ob `PUBLIC_STRAPI_URL` korrekt gesetzt ist
- Verwende `getStrapiMediaUrl()` Helper

### Build Fehler

Strapi muss während des Build-Prozesses erreichbar sein:
- Für lokale Builds: Strapi vorher starten
- Für CI/CD: Strapi Cloud URL verwenden

## Best Practices

1. **Immer Publish**: Speichern reicht nicht - Inhalte müssen veröffentlicht werden
2. **Bilder optimieren**: Vor Upload komprimieren (TinyPNG)
3. **Order-Feld nutzen**: Für konsistente Sortierung
4. **Backup**: Regelmäßig Daten exportieren (Content-Export Plugin)
5. **Versionskontrolle**: `.env` Dateien nie committen

## Weiterführende Ressourcen

- [Strapi Dokumentation](https://docs.strapi.io)
- [Strapi Cloud](https://cloud.strapi.io)
- [Astro Integration](https://docs.astro.build/en/guides/cms/strapi/)

## Support

Bei Problemen:
1. Strapi Logs prüfen (Terminal)
2. Browser Console prüfen
3. Network Tab für API-Fehler

---

Erstellt für IGNITE by Claude Code
