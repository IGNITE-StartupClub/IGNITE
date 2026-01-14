// KPI Dashboard Daten
// Diese Datei kann manuell bearbeitet werden um die Kennzahlen zu aktualisieren

export interface KPIItem {
  value: number;
  label: string;
  icon: 'calendar' | 'users' | 'heart' | 'book' | 'building' | 'star';
  suffix?: string; // z.B. "+" für "500+"
}

export const kpiData: KPIItem[] = [
  {
    value: 11,
    label: "Veranstaltungen",
    icon: "calendar",
    suffix: "+"
  },
  {
    value: 15,
    label: "Teammitglieder",
    icon: "users"
  },
  {
    value: 2000,
    label: "Erreichte Menschen",
    icon: "heart",
    suffix: "+"
  },
  {
    value: 5,
    label: "Partner",
    icon: "building",
    suffix: "+"
  }
];

export const kpiHeading = "Unsere Wirkung";
export const kpiSubheading = "Was wir gemeinsam erreicht haben";
