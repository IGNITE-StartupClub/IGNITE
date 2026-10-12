// Kennzahlen der Startseite (Section "Wirkung"). Manuell pflegen, nur echte Zahlen.

export interface KPIItem {
  value: number
  label: string
  icon: string // astro-icon name (ion:*)
  suffix?: string // z.B. "+" für "11+"
}

export const kpiData: KPIItem[] = [
  { value: 11, label: 'Veranstaltungen', icon: 'ion:calendar-outline', suffix: '+' },
  { value: 15, label: 'Teammitglieder', icon: 'ion:people-outline' },
  { value: 2000, label: 'Erreichte Menschen', icon: 'ion:heart-outline', suffix: '+' },
  { value: 5, label: 'Partner', icon: 'ion:business-outline', suffix: '+' },
]
