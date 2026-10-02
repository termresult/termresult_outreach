import { describe, expect, it } from "vitest";
import { SCHOOL_INTEL } from "@/lib/schools/intel";
import {
  catalogSizeFees,
  formatFeeRange,
  formatNaira,
  rankSchools,
  resolveSizeFees,
  sortRanked,
} from "@/lib/schools/size-fees";

describe("school size and fees", () => {
  it("loads every researched school from the intelligence sheet", () => {
    expect(Object.keys(SCHOOL_INTEL)).toHaveLength(109);
  });

  it("uses the sheet figures for Africa International College", () => {
    const row = catalogSizeFees("Africa international college");
    expect(row.source).toBe("published");
    expect(row.sheet_rank).toBe(2);
    expect(row.student_low).toBe(600);
    expect(row.student_high).toBe(1000);
    expect(row.average_fees).toBe(425000);
  });

  it("uses the sheet range for COSA-BIG-G", () => {
    const row = catalogSizeFees("COSA-BIG-G SCHOOL BAGUSA");
    expect(row.sheet_rank).toBe(81);
    expect(row.student_low).toBe(80);
    expect(row.student_high).toBe(180);
  });

  it("keeps a saved operator number over the catalog", () => {
    const row = resolveSizeFees("Africa international college", {
      student_count: 90,
      average_fees: 50000,
    });
    expect(row.source).toBe("operator");
    expect(row.student_count).toBe(90);
    expect(row.average_fees).toBe(50000);
  });

  it("ranks by the sheet size order", () => {
    const ranked = rankSchools([
      { school_name: "Tots Academy Abuja" },
      { school_name: "AGGS, Apo" },
      { school_name: "Africa international college" },
    ]);
    expect(ranked.map((row) => row.school_name)).toEqual([
      "AGGS, Apo",
      "Africa international college",
      "Tots Academy Abuja",
    ]);
    expect(ranked.map((row) => row.size_rank)).toEqual([1, 2, 108]);
  });

  it("can sort ranked rows by name", () => {
    const ranked = rankSchools([
      { school_name: "Tots Academy Abuja" },
      { school_name: "Africa international college" },
    ]);
    expect(sortRanked(ranked, "name").map((row) => row.school_name)).toEqual([
      "Africa international college",
      "Tots Academy Abuja",
    ]);
  });

  it("formats naira ranges", () => {
    expect(formatNaira(400000)).toBe("₦400,000");
    expect(formatNaira(null)).toBe("—");
    expect(formatFeeRange(catalogSizeFees("Bankys Private School"))).toBe(
      "₦50,000–₦150,000 / term",
    );
  });
});
