// Event-Liste für das Feedback-Formular
// Diese Datei kann manuell bearbeitet werden um Events hinzuzufügen oder zu entfernen

export interface EventItem {
  id: string;
  name: string;
  date?: string; // Optional: Datum für bessere Übersicht
}

export const events: EventItem[] = [
  {
    id: "ssg-2026",
    name: "Student Startup Guide Event",
    date: "2026-01-14"
  },
];

// Für Dropdown-Anzeige: Name mit optionalem Datum
export const getEventDisplayName = (event: EventItem): string => {
  return event.date ? `${event.name} (${event.date})` : event.name;
};
