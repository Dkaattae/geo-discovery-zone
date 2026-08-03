/**
 * The manual override table §1.7 warns you will need anyway.
 *
 * Two jobs:
 *
 * 1. **Join keys.** FIPS is what `frontend/src/components/UsMap.tsx` joins on,
 *    and a wrong or missing code means a state that cannot be highlighted. FIPS
 *    codes are fixed by federal standard and never change, so they belong in
 *    source control rather than in a nightly query result. Wikidata's P5086 is
 *    still read and cross-checked against this table; mismatches surface in the
 *    build report instead of silently winning.
 *
 * 2. **Fields Wikidata is bad at.** Region is this app's own vocabulary, not a
 *    Wikidata concept. Animals and kid-facing climate phrasing are called out in
 *    §1.9 as hand-curation — the coverage genuinely is not there, and a wrong
 *    state animal in a children's quiz is worse than a blank one.
 *
 * `name` is the join key against Wikidata's English label.
 */

export interface CuratedState {
  postal: string;
  name: string;
  /** FIPS 5-2 numeric, zero-padded. The map's join key. */
  fips: string;
  /** This app's region vocabulary — matches the values already in the frontend. */
  region: string;
  /** Kid-facing climate phrasing (§1.9: map Köppen codes yourself). */
  climate_kid?: string;
  /** §1.9 flags animals as hand-curate — left blank rather than guessed. */
  state_animal?: string;
  landmark?: string;
}

export const CURATED_US_STATES: CuratedState[] = [
  { postal: "AL", name: "Alabama", fips: "01", region: "Southeast" },
  { postal: "AK", name: "Alaska", fips: "02", region: "Pacific" },
  { postal: "AZ", name: "Arizona", fips: "04", region: "Southwest" },
  { postal: "AR", name: "Arkansas", fips: "05", region: "South Central" },
  { postal: "CA", name: "California", fips: "06", region: "Pacific" },
  {
    postal: "CO",
    name: "Colorado",
    fips: "08",
    region: "Mountain West",
    climate_kid: "dry and cold in the mountains, drier plains to the east",
    landmark: "Rocky Mountain National Park",
  },
  { postal: "CT", name: "Connecticut", fips: "09", region: "Northeast" },
  { postal: "DE", name: "Delaware", fips: "10", region: "Northeast" },
  { postal: "FL", name: "Florida", fips: "12", region: "Southeast" },
  { postal: "GA", name: "Georgia", fips: "13", region: "Southeast" },
  { postal: "HI", name: "Hawaii", fips: "15", region: "Pacific" },
  { postal: "ID", name: "Idaho", fips: "16", region: "Mountain West" },
  { postal: "IL", name: "Illinois", fips: "17", region: "Midwest" },
  { postal: "IN", name: "Indiana", fips: "18", region: "Midwest" },
  { postal: "IA", name: "Iowa", fips: "19", region: "Midwest" },
  { postal: "KS", name: "Kansas", fips: "20", region: "Midwest" },
  { postal: "KY", name: "Kentucky", fips: "21", region: "Southeast" },
  { postal: "LA", name: "Louisiana", fips: "22", region: "South Central" },
  { postal: "ME", name: "Maine", fips: "23", region: "Northeast" },
  { postal: "MD", name: "Maryland", fips: "24", region: "Northeast" },
  { postal: "MA", name: "Massachusetts", fips: "25", region: "Northeast" },
  { postal: "MI", name: "Michigan", fips: "26", region: "Midwest" },
  { postal: "MN", name: "Minnesota", fips: "27", region: "Midwest" },
  { postal: "MS", name: "Mississippi", fips: "28", region: "Southeast" },
  { postal: "MO", name: "Missouri", fips: "29", region: "Midwest" },
  { postal: "MT", name: "Montana", fips: "30", region: "Mountain West" },
  { postal: "NE", name: "Nebraska", fips: "31", region: "Midwest" },
  { postal: "NV", name: "Nevada", fips: "32", region: "Mountain West" },
  { postal: "NH", name: "New Hampshire", fips: "33", region: "Northeast" },
  { postal: "NJ", name: "New Jersey", fips: "34", region: "Northeast" },
  { postal: "NM", name: "New Mexico", fips: "35", region: "Southwest" },
  { postal: "NY", name: "New York", fips: "36", region: "Northeast" },
  { postal: "NC", name: "North Carolina", fips: "37", region: "Southeast" },
  { postal: "ND", name: "North Dakota", fips: "38", region: "Midwest" },
  { postal: "OH", name: "Ohio", fips: "39", region: "Midwest" },
  { postal: "OK", name: "Oklahoma", fips: "40", region: "South Central" },
  { postal: "OR", name: "Oregon", fips: "41", region: "Pacific Northwest" },
  { postal: "PA", name: "Pennsylvania", fips: "42", region: "Northeast" },
  { postal: "RI", name: "Rhode Island", fips: "44", region: "Northeast" },
  { postal: "SC", name: "South Carolina", fips: "45", region: "Southeast" },
  { postal: "SD", name: "South Dakota", fips: "46", region: "Midwest" },
  { postal: "TN", name: "Tennessee", fips: "47", region: "Southeast" },
  { postal: "TX", name: "Texas", fips: "48", region: "South Central" },
  { postal: "UT", name: "Utah", fips: "49", region: "Mountain West" },
  { postal: "VT", name: "Vermont", fips: "50", region: "Northeast" },
  { postal: "VA", name: "Virginia", fips: "51", region: "Southeast" },
  { postal: "WA", name: "Washington", fips: "53", region: "Pacific Northwest" },
  { postal: "WV", name: "West Virginia", fips: "54", region: "Southeast" },
  { postal: "WI", name: "Wisconsin", fips: "55", region: "Midwest" },
  { postal: "WY", name: "Wyoming", fips: "56", region: "Mountain West" },
];

export const curatedByName = new Map(CURATED_US_STATES.map((s) => [s.name.toLowerCase(), s]));
export const curatedByPostal = new Map(CURATED_US_STATES.map((s) => [s.postal, s]));

/** `us-state-co` — matches the ids already in `frontend/src/data/entities.ts`. */
export const entityIdFor = (postal: string) => `us-state-${postal.toLowerCase()}`;
