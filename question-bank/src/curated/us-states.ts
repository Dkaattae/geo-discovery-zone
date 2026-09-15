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

import type { FunFact } from "../types";

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
  /**
   * §1.6: human-reviewed prose, folded into the entity's `fun_facts` by
   * `normalize.ts` the same way `climate_kid`, `state_animal` and `landmark`
   * already are. This is the one field this table holds where `reviewed` must
   * always read `true` — an unreviewed draft belongs in `fun-facts.review.json`
   * (`build.ts`'s `writeReviewFile`), never here (`engineering-decisions.md` E-6).
   */
  fun_facts?: FunFact[];
}

export const CURATED_US_STATES: CuratedState[] = [
  {
    postal: "AL",
    name: "Alabama",
    fips: "01",
    region: "Southeast",
    state_animal: "American black bear",
    fun_facts: [
      {
        text: "Alabama's Space & Rocket Center displays a real Saturn V moon rocket lying on its side.",
        source_url: "https://en.wikipedia.org/wiki/Alabama",
        reviewed: true,
      },
    ],
  },
  {
    postal: "AK",
    name: "Alaska",
    fips: "02",
    region: "Pacific",
    state_animal: "Moose",
    fun_facts: [
      {
        text: "Alaska is the biggest state, and in summer the sun barely sets in the far north.",
        source_url: "https://en.wikipedia.org/wiki/Alaska",
        reviewed: true,
      },
    ],
  },
  {
    postal: "AZ",
    name: "Arizona",
    fips: "04",
    region: "Southwest",
    state_animal: "Ringtail",
    fun_facts: [
      {
        text: "Arizona is home to the Grand Canyon, a mile-deep gorge carved by the Colorado River.",
        source_url: "https://en.wikipedia.org/wiki/Arizona",
        reviewed: true,
      },
    ],
  },
  {
    postal: "AR",
    name: "Arkansas",
    fips: "05",
    region: "South Central",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Arkansas has a diamond park where visitors can dig all day and keep any diamond they find.",
        source_url: "https://en.wikipedia.org/wiki/Arkansas",
        reviewed: true,
      },
    ],
  },
  {
    postal: "CA",
    name: "California",
    fips: "06",
    region: "Pacific",
    state_animal: "California grizzly bear",
    fun_facts: [
      {
        text: "California holds the highest and lowest places in the lower 48 states, and they are close together.",
        source_url: "https://en.wikipedia.org/wiki/California",
        reviewed: true,
      },
    ],
  },
  {
    postal: "CO",
    name: "Colorado",
    fips: "08",
    region: "Mountain West",
    state_animal: "Rocky Mountain bighorn sheep",
    climate_kid: "dry and cold in the mountains, drier plains to the east",
    landmark: "Rocky Mountain National Park",
    fun_facts: [
      {
        text: "Colorado has 58 mountains taller than 14,000 feet. Climbers call them fourteeners.",
        source_url: "https://en.wikipedia.org/wiki/Colorado",
        reviewed: true,
      },
    ],
  },
  {
    postal: "CT",
    name: "Connecticut",
    fips: "09",
    region: "Northeast",
    state_animal: "Sperm whale",
    fun_facts: [
      {
        text: "Connecticut is home to the oldest continuously published newspaper in the United States.",
        source_url: "https://en.wikipedia.org/wiki/Connecticut",
        reviewed: true,
      },
    ],
  },
  {
    postal: "DE",
    name: "Delaware",
    fips: "10",
    region: "Northeast",
    state_animal: "Gray fox",
    fun_facts: [
      {
        text: "Delaware was the first state to ratify the Constitution, so it is nicknamed The First State.",
        source_url: "https://en.wikipedia.org/wiki/Delaware",
        reviewed: true,
      },
    ],
  },
  {
    postal: "FL",
    name: "Florida",
    fips: "12",
    region: "Southeast",
    state_animal: "Florida panther",
    fun_facts: [
      {
        text: "Florida is a peninsula, which means water wraps around it on three sides.",
        source_url: "https://en.wikipedia.org/wiki/Florida",
        reviewed: true,
      },
    ],
  },
  {
    postal: "GA",
    name: "Georgia",
    fips: "13",
    region: "Southeast",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Georgia grows more peanuts than any other state in the whole country.",
        source_url: "https://en.wikipedia.org/wiki/Georgia",
        reviewed: true,
      },
    ],
  },
  {
    postal: "HI",
    name: "Hawaii",
    fips: "15",
    region: "Pacific",
    state_animal: "Hawaiian monk seal",
    fun_facts: [
      {
        text: "Hawaii is made of volcanoes, and it is still growing today.",
        source_url: "https://en.wikipedia.org/wiki/Hawaii",
        reviewed: true,
      },
    ],
  },
  {
    postal: "ID",
    name: "Idaho",
    fips: "16",
    region: "Mountain West",
    state_animal: "Mountain bluebird",
    fun_facts: [
      {
        text: "Idaho grows more potatoes than any other state, and its license plates say Famous Potatoes.",
        source_url: "https://en.wikipedia.org/wiki/Idaho",
        reviewed: true,
      },
    ],
  },
  {
    postal: "IL",
    name: "Illinois",
    fips: "17",
    region: "Midwest",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Illinois is home to Chicago's Willis Tower, once the tallest building in the whole world.",
        source_url: "https://en.wikipedia.org/wiki/Illinois",
        reviewed: true,
      },
    ],
  },
  {
    postal: "IN",
    name: "Indiana",
    fips: "18",
    region: "Midwest",
    state_animal: "Northern cardinal",
    fun_facts: [
      {
        text: "Indiana hosts the Indianapolis 500, one of the biggest car races in the world.",
        source_url: "https://en.wikipedia.org/wiki/Indiana",
        reviewed: true,
      },
    ],
  },
  {
    postal: "IA",
    name: "Iowa",
    fips: "19",
    region: "Midwest",
    state_animal: "American goldfinch",
    fun_facts: [
      {
        text: "Iowa grows more corn than any other state, with fields stretching as far as you can see.",
        source_url: "https://en.wikipedia.org/wiki/Iowa",
        reviewed: true,
      },
    ],
  },
  {
    postal: "KS",
    name: "Kansas",
    fips: "20",
    region: "Midwest",
    state_animal: "American bison",
    fun_facts: [
      {
        text: "Kansas sits almost exactly in the middle of the country.",
        source_url: "https://en.wikipedia.org/wiki/Kansas",
        reviewed: true,
      },
    ],
  },
  {
    postal: "KY",
    name: "Kentucky",
    fips: "21",
    region: "Southeast",
    state_animal: "Gray squirrel",
    fun_facts: [
      {
        text: "Kentucky is famous for the Kentucky Derby, a horse race run every year since 1875.",
        source_url: "https://en.wikipedia.org/wiki/Kentucky",
        reviewed: true,
      },
    ],
  },
  {
    postal: "LA",
    name: "Louisiana",
    fips: "22",
    region: "South Central",
    state_animal: "Black bear",
    fun_facts: [
      {
        text: "The Mississippi River dumps its mud in Louisiana, building new land as it goes.",
        source_url: "https://en.wikipedia.org/wiki/Louisiana",
        reviewed: true,
      },
    ],
  },
  {
    postal: "ME",
    name: "Maine",
    fips: "23",
    region: "Northeast",
    state_animal: "Moose",
    fun_facts: [
      {
        text: "The sun rises over Maine before anywhere else in the United States.",
        source_url: "https://en.wikipedia.org/wiki/Maine",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MD",
    name: "Maryland",
    fips: "24",
    region: "Northeast",
    state_animal: "Baltimore oriole",
    fun_facts: [
      {
        text: "Maryland's Chesapeake Bay is the largest estuary in the United States, full of blue crabs.",
        source_url: "https://en.wikipedia.org/wiki/Maryland",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MA",
    name: "Massachusetts",
    fips: "25",
    region: "Northeast",
    state_animal: "Right whale",
    fun_facts: [
      {
        text: "Massachusetts is home to Plymouth Rock, where the Pilgrims are said to have landed in 1620.",
        source_url: "https://en.wikipedia.org/wiki/Massachusetts",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MI",
    name: "Michigan",
    fips: "26",
    region: "Midwest",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Michigan is shaped like a mitten, and it touches four of the five Great Lakes.",
        source_url: "https://en.wikipedia.org/wiki/Michigan",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MN",
    name: "Minnesota",
    fips: "27",
    region: "Midwest",
    state_animal: "Common loon",
    fun_facts: [
      {
        text: "Minnesota calls itself the land of 10,000 lakes. It actually has closer to 12,000.",
        source_url: "https://en.wikipedia.org/wiki/Minnesota",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MS",
    name: "Mississippi",
    fips: "28",
    region: "Southeast",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Mississippi is named after the Mississippi River, one of the longest rivers in North America.",
        source_url: "https://en.wikipedia.org/wiki/Mississippi",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MO",
    name: "Missouri",
    fips: "29",
    region: "Midwest",
    state_animal: "Mule",
    fun_facts: [
      {
        text: "Missouri is home to the Gateway Arch in Saint Louis, the tallest monument in the country.",
        source_url: "https://en.wikipedia.org/wiki/Missouri",
        reviewed: true,
      },
    ],
  },
  {
    postal: "MT",
    name: "Montana",
    fips: "30",
    region: "Mountain West",
    state_animal: "Grizzly bear",
    fun_facts: [
      {
        text: "Montana is nicknamed Big Sky Country because its skies stretch out over such wide open land.",
        source_url: "https://en.wikipedia.org/wiki/Montana",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NE",
    name: "Nebraska",
    fips: "31",
    region: "Midwest",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Nebraska is home to Chimney Rock, a tall spire that guided pioneers along the Oregon Trail.",
        source_url: "https://en.wikipedia.org/wiki/Nebraska",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NV",
    name: "Nevada",
    fips: "32",
    region: "Mountain West",
    state_animal: "Desert bighorn sheep",
    fun_facts: [
      {
        text: "Nevada is the driest state, and rain that falls there never reaches the ocean.",
        source_url: "https://en.wikipedia.org/wiki/Nevada",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NH",
    name: "New Hampshire",
    fips: "33",
    region: "Northeast",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "New Hampshire was the first state to write its own constitution, before the country even had one.",
        source_url: "https://en.wikipedia.org/wiki/New_Hampshire",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NJ",
    name: "New Jersey",
    fips: "34",
    region: "Northeast",
    state_animal: "Horse",
    fun_facts: [
      {
        text: "New Jersey is home to the first boardwalk in the country, built in Atlantic City in 1870.",
        source_url: "https://en.wikipedia.org/wiki/New_Jersey",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NM",
    name: "New Mexico",
    fips: "35",
    region: "Southwest",
    state_animal: "American black bear",
    fun_facts: [
      {
        text: "New Mexico is home to Carlsbad Caverns, an underground cave system with rooms as big as a stadium.",
        source_url: "https://en.wikipedia.org/wiki/New_Mexico",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NY",
    name: "New York",
    fips: "36",
    region: "Northeast",
    state_animal: "Beaver",
    fun_facts: [
      {
        text: "New York City is the biggest city in the country, but it is not the state capital.",
        source_url: "https://en.wikipedia.org/wiki/New_York",
        reviewed: true,
      },
    ],
  },
  {
    postal: "NC",
    name: "North Carolina",
    fips: "37",
    region: "Southeast",
    state_animal: "Eastern gray squirrel",
    fun_facts: [
      {
        text: "North Carolina is where the Wright brothers flew the first airplane, at Kitty Hawk in 1903.",
        source_url: "https://en.wikipedia.org/wiki/North_Carolina",
        reviewed: true,
      },
    ],
  },
  {
    postal: "ND",
    name: "North Dakota",
    fips: "38",
    region: "Midwest",
    state_animal: "Western meadowlark",
    fun_facts: [
      {
        text: "North Dakota's Theodore Roosevelt National Park is home to wild bison roaming the badlands.",
        source_url: "https://en.wikipedia.org/wiki/North_Dakota",
        reviewed: true,
      },
    ],
  },
  {
    postal: "OH",
    name: "Ohio",
    fips: "39",
    region: "Midwest",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Ohio was home to the Wright brothers, who built their first airplane in a bicycle shop.",
        source_url: "https://en.wikipedia.org/wiki/Ohio",
        reviewed: true,
      },
    ],
  },
  {
    postal: "OK",
    name: "Oklahoma",
    fips: "40",
    region: "South Central",
    state_animal: "American bison",
    fun_facts: [
      {
        text: "Oklahoma has more man-made lakes than any other state in the country.",
        source_url: "https://en.wikipedia.org/wiki/Oklahoma",
        reviewed: true,
      },
    ],
  },
  {
    postal: "OR",
    name: "Oregon",
    fips: "41",
    region: "Pacific Northwest",
    state_animal: "Beaver",
    fun_facts: [
      {
        text: "Oregon is home to Crater Lake, the deepest lake in the United States.",
        source_url: "https://en.wikipedia.org/wiki/Oregon",
        reviewed: true,
      },
    ],
  },
  {
    postal: "PA",
    name: "Pennsylvania",
    fips: "42",
    region: "Northeast",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "Pennsylvania is where the Declaration of Independence was signed, in Philadelphia in 1776.",
        source_url: "https://en.wikipedia.org/wiki/Pennsylvania",
        reviewed: true,
      },
    ],
  },
  {
    postal: "RI",
    name: "Rhode Island",
    fips: "44",
    region: "Northeast",
    state_animal: "Harbor seal",
    fun_facts: [
      {
        text: "Rhode Island is the smallest state, yet it has over 400 miles of coastline.",
        source_url: "https://en.wikipedia.org/wiki/Rhode_Island",
        reviewed: true,
      },
    ],
  },
  {
    postal: "SC",
    name: "South Carolina",
    fips: "45",
    region: "Southeast",
    state_animal: "White-tailed deer",
    fun_facts: [
      {
        text: "South Carolina's official state dance is the shag, first danced on its beaches in the 1940s.",
        source_url: "https://en.wikipedia.org/wiki/South_Carolina",
        reviewed: true,
      },
    ],
  },
  {
    postal: "SD",
    name: "South Dakota",
    fips: "46",
    region: "Midwest",
    state_animal: "Coyote",
    fun_facts: [
      {
        text: "South Dakota is home to Mount Rushmore, where four presidents' faces are carved into granite.",
        source_url: "https://en.wikipedia.org/wiki/South_Dakota",
        reviewed: true,
      },
    ],
  },
  {
    postal: "TN",
    name: "Tennessee",
    fips: "47",
    region: "Southeast",
    state_animal: "Raccoon",
    fun_facts: [
      {
        text: "Tennessee is home to Great Smoky Mountains National Park, the most visited national park in the country.",
        source_url: "https://en.wikipedia.org/wiki/Tennessee",
        reviewed: true,
      },
    ],
  },
  {
    postal: "TX",
    name: "Texas",
    fips: "48",
    region: "South Central",
    state_animal: "Armadillo",
    fun_facts: [
      {
        text: "Texas is so wide that El Paso is closer to California than to Houston.",
        source_url: "https://en.wikipedia.org/wiki/Texas",
        reviewed: true,
      },
    ],
  },
  {
    postal: "UT",
    name: "Utah",
    fips: "49",
    region: "Mountain West",
    state_animal: "Rocky Mountain elk",
    fun_facts: [
      {
        text: "Utah is home to five national parks, more than almost any other state.",
        source_url: "https://en.wikipedia.org/wiki/Utah",
        reviewed: true,
      },
    ],
  },
  {
    postal: "VT",
    name: "Vermont",
    fips: "50",
    region: "Northeast",
    state_animal: "Morgan horse",
    fun_facts: [
      {
        text: "Vermont produces more maple syrup than any other state in the country.",
        source_url: "https://en.wikipedia.org/wiki/Vermont",
        reviewed: true,
      },
    ],
  },
  {
    postal: "VA",
    name: "Virginia",
    fips: "51",
    region: "Southeast",
    state_animal: "Virginia big-eared bat",
    fun_facts: [
      {
        text: "Virginia is nicknamed the Mother of Presidents because eight American presidents were born there.",
        source_url: "https://en.wikipedia.org/wiki/Virginia",
        reviewed: true,
      },
    ],
  },
  {
    postal: "WA",
    name: "Washington",
    fips: "53",
    region: "Pacific Northwest",
    state_animal: "Orca",
    fun_facts: [
      {
        text: "One side of Washington is a rainforest and the other side is nearly a desert.",
        source_url: "https://en.wikipedia.org/wiki/Washington_(state)",
        reviewed: true,
      },
    ],
  },
  {
    postal: "WV",
    name: "West Virginia",
    fips: "54",
    region: "Southeast",
    state_animal: "American black bear",
    fun_facts: [
      {
        text: "West Virginia broke away from Virginia in 1863 to become its own separate state.",
        source_url: "https://en.wikipedia.org/wiki/West_Virginia",
        reviewed: true,
      },
    ],
  },
  {
    postal: "WI",
    name: "Wisconsin",
    fips: "55",
    region: "Midwest",
    state_animal: "American badger",
    fun_facts: [
      {
        text: "Wisconsin produces more cheese than any other state, earning it the nickname America's Dairyland.",
        source_url: "https://en.wikipedia.org/wiki/Wisconsin",
        reviewed: true,
      },
    ],
  },
  {
    postal: "WY",
    name: "Wyoming",
    fips: "56",
    region: "Mountain West",
    state_animal: "American bison",
    fun_facts: [
      {
        text: "Wyoming is home to Yellowstone, the first national park ever created anywhere in the world.",
        source_url: "https://en.wikipedia.org/wiki/Wyoming",
        reviewed: true,
      },
    ],
  },
];

export const curatedByName = new Map(CURATED_US_STATES.map((s) => [s.name.toLowerCase(), s]));
export const curatedByPostal = new Map(CURATED_US_STATES.map((s) => [s.postal, s]));

/** `us-state-co` — matches the ids already in `frontend/src/data/entities.ts`. */
export const entityIdFor = (postal: string) => `us-state-${postal.toLowerCase()}`;
