# Archiv

Stand: 2026-10-04

Hier liegen Seiten und Bausteine, die nicht mehr gebaut werden (Ordner liegt außerhalb von `src/`, Astro routet sie nicht).

| Archiviert | Inhalt |
|---|---|
| `pages/team.astro` | Team-Seite mit Modals |
| `data/teamsData.ts` | Daten der Team-Seite (nur dort genutzt) |
| `pages/about.astro` | Über-uns-Seite |
| `pages/stakeholder-journey.astro` | Stakeholder Journey Map |
| `components/stakeholder-map/` | Komponenten der Journey Map |
| `components/LiquidEther/` | WebGL-Hintergrund der Journey Map (three.js) |
| `types/stakeholder-map.ts` | Typen der Journey Map |

Grund: Die Seiten sind nirgends verlinkt und nicht Teil des Redesigns. Sie sind nicht im neuen Design gestaltet.

## Wiederherstellen

1. Dateien mit `git mv` zurück nach `src/pages/`, `src/components/`, `src/data/` bzw. `src/types/` verschieben.
2. Importpfade anpassen und die Abhängigkeiten wieder installieren (`accessible-astro-components` für die Team-Seite, `three` für LiquidEther).
3. Seite im neuen Design (Section, Card, Button) neu aufbauen und bei Bedarf in die Navigation eintragen.
