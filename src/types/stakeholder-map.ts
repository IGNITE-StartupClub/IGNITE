// =============================================================================
// TYPE DEFINITIONS FOR STAKEHOLDER MAP
// =============================================================================

export type StakeholderDetail = {
  full: string;      // full description
  func: string;      // function in network
  contact: string;   // contact information
};

export type Stakeholder = {
  id: string;
  nm: string;        // name
  logo: string;      // logo URL
  pill: string;      // category pill
  desc: string;      // short description
  url: string;       // website URL
  det: StakeholderDetail;
};

export type Phase = {
  id: string;
  n: number;         // order
  t: string;         // title
  cat: string;       // category
  st: Stakeholder[]; // stakeholders
};

export type MapData = {
  cur: { p: string; s: string };  // current selection
  ph: Phase[];                     // phases
};
