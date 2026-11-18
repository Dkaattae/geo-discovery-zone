import { describe, expect, test } from "bun:test";

import {
  compareCapitals,
  parseCsv,
  placeMatchesCapital,
  placesByState,
  releaseUrl,
} from "./largest-city";

// A few rows in the release's own shape, values made up. 157 is a place part
// within a county and must be ignored; 040 is the state row.
const CSV = [
  "SUMLEV,STATE,COUNTY,PLACE,NAME,STNAME,POPESTIMATE2023,POPESTIMATE2024",
  "040,47,000,00000,Tennessee,Tennessee,7000000,7100000",
  '162,47,000,52006,"Nashville-Davidson metropolitan government (balance)",Tennessee,680000,690000',
  "162,47,000,48000,Memphis city,Tennessee,620000,610000",
  "157,47,157,48000,Memphis city,Tennessee,9000000,9000000",
  "162,54,000,14600,Charleston city,West Virginia,47000,46000",
  "162,54,000,39460,Huntington city,West Virginia,46000,46000",
  "162,28,000,36000,Jackson city,Mississippi,145000,140000",
  "162,28,000,29700,Gulfport city,Mississippi,72000,73000",
  "162,12,000,35000,Jacksonville city,Florida,970000,990000",
  "162,12,000,70600,Tallahassee city,Florida,200000,201000",
  "",
].join("\r\n");

describe("parseCsv", () => {
  test("keeps commas and doubled quotes inside quoted fields", () => {
    expect(parseCsv('a,"b, c","say ""hi"""\n1,2,3')).toEqual([
      ["a", "b, c", 'say "hi"'],
      ["1", "2", "3"],
    ]);
  });

  test("handles CRLF and a missing final newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("placesByState", () => {
  test("keeps only whole incorporated places, with the vintage's column", () => {
    const tn = placesByState(CSV, 2024).get("Tennessee");
    expect(tn).toEqual([
      { name: "Nashville-Davidson metropolitan government (balance)", population: 690000 },
      { name: "Memphis city", population: 610000 },
    ]);
  });

  test("refuses a vintage the file has no column for", () => {
    expect(() => placesByState(CSV, 2025)).toThrow("POPESTIMATE2025");
  });
});

describe("placeMatchesCapital", () => {
  test.each([
    ["Boise City city", "Boise", true],
    ["Nashville-Davidson metropolitan government (balance)", "Nashville", true],
    ["Jackson city", "Jackson", true],
    ["Jacksonville city", "Jackson", false],
    ["Oklahoma City city", "Oklahoma City", true],
  ])("%s / %s → %p", (place, capital, want) => {
    expect(placeMatchesCapital(place, capital)).toBe(want);
  });
});

describe("compareCapitals", () => {
  const places = placesByState(CSV, 2024);
  const rows = compareCapitals(
    [
      { state: "Tennessee", capital: "Nashville" },
      { state: "West Virginia", capital: "Charleston" },
      { state: "Mississippi", capital: "Jackson" },
      { state: "Florida", capital: "Tallahassee" },
      { state: "Hawaii", capital: "Honolulu" },
    ],
    places,
  );
  const verdict = (state: string) => rows.find((r) => r.state === state)?.verdict;

  test("a capital strictly larger than every other place is largest", () => {
    expect(verdict("Tennessee")).toBe("capital is largest");
    expect(rows[0]?.margin).toBe(80000);
    expect(verdict("Mississippi")).toBe("capital is largest");
  });

  test("a tie is not largest", () => {
    expect(verdict("West Virginia")).toBe("capital is not largest");
    expect(rows[1]?.margin).toBe(0);
  });

  test("a smaller capital is not largest", () => {
    expect(verdict("Florida")).toBe("capital is not largest");
  });

  test("a capital the release does not hold is flagged, not guessed", () => {
    const hi = rows.find((r) => r.state === "Hawaii");
    expect(hi?.verdict).toBe("capital not in release");
    expect(hi?.capital_place).toBeNull();
  });
});

test("releaseUrl names the vintage's sub-est file", () => {
  expect(releaseUrl(2024)).toBe(
    "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv",
  );
});
