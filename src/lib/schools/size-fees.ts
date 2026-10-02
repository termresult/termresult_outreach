import { schoolKey } from "@/lib/proprietors/school-key";
import { SCHOOL_INTEL } from "@/lib/schools/intel";

export const SIZE_FEE_SOURCES = ["operator", "published", "outreach", "estimate"] as const;

export type SizeFeeSource = (typeof SIZE_FEE_SOURCES)[number];

export type SizeFees = {
  student_count: number;
  average_fees: number;
  student_low: number;
  student_high: number;
  fee_low: number;
  fee_high: number;
  source: SizeFeeSource;
  term_book: number;
  sheet_rank: number | null;
  size_label: string | null;
};

export const SIZE_FEE_LABELS: Record<SizeFeeSource, string> = {
  operator: "Saved",
  published: "Listed",
  outreach: "From call",
  estimate: "Estimate",
};

export type SizeSort = "rank" | "students" | "fees" | "name";

function asCount(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function withBook(row: Omit<SizeFees, "term_book">): SizeFees {
  return { ...row, term_book: row.student_count * row.average_fees };
}

function fromCounts(
  students: number,
  fees: number,
  source: SizeFeeSource,
  extra?: Partial<SizeFees>,
): SizeFees {
  return withBook({
    student_count: students,
    average_fees: fees,
    student_low: extra?.student_low ?? students,
    student_high: extra?.student_high ?? students,
    fee_low: extra?.fee_low ?? fees,
    fee_high: extra?.fee_high ?? fees,
    source,
    sheet_rank: extra?.sheet_rank ?? null,
    size_label: extra?.size_label ?? null,
  });
}

export function estimateSizeFees(schoolName: string): SizeFees {
  const name = schoolKey(schoolName);

  if (name.includes("nawoj") || name.includes("women journalists")) {
    return fromCounts(40, 20000, "estimate");
  }
  if (name.includes("nspire") || name.includes("management and technology")) {
    return fromCounts(160, 180000, "estimate");
  }
  if (name.includes("culinary")) {
    return fromCounts(60, 120000, "estimate");
  }
  if (name === "kazahchat") {
    return fromCounts(80, 35000, "estimate");
  }

  let students = 120;
  let fees = 45000;

  if (/(tasha|gwagwa|dei dei|kaba|pegi|nyanya|bagusa|sauka|wanu)/.test(name)) {
    students = 95;
    fees = 32000;
  } else if (/(kuje|kubwa|apo|lokogoma|lugbe|karu|wumba|mpape|giri)/.test(name)) {
    students = 140;
    fees = 55000;
  } else if (/(jahi|mabushi|wuse|gaduwa|kaura)/.test(name)) {
    students = 180;
    fees = 140000;
  }

  if (/(kiddies|kids|childcare|creche|babies)/.test(name)) {
    students = Math.min(students, 90);
  }
  if (name.includes("montessori") || name.includes("premier")) {
    fees = Math.max(fees, 100000);
    students = Math.max(students, 160);
  }
  if (name.includes("international college") || name.includes("int'l college")) {
    students = Math.max(students, 500);
    fees = Math.max(fees, 280000);
  } else if (/\binternational\b|int'l|\bintl\b/.test(name) || name.includes("college")) {
    students = Math.max(students, 220);
    fees = Math.max(fees, 120000);
  }

  return fromCounts(students, fees, "estimate");
}

export function catalogSizeFees(schoolName: string): SizeFees {
  const listed = SCHOOL_INTEL[schoolKey(schoolName)];
  if (!listed) return estimateSizeFees(schoolName);
  return fromCounts(listed.student_count, listed.average_fees, listed.source, {
    student_low: listed.student_low,
    student_high: listed.student_high,
    fee_low: listed.fee_low,
    fee_high: listed.fee_high,
    sheet_rank: listed.sheet_rank,
    size_label: listed.size_label,
  });
}

export function resolveSizeFees(
  schoolName: string,
  stored?: { student_count?: number | null; average_fees?: number | null },
): SizeFees {
  const catalog = catalogSizeFees(schoolName);
  const students = asCount(stored?.student_count);
  const fees = asCount(stored?.average_fees);
  const touched = students != null || fees != null;
  if (!touched) return catalog;
  return fromCounts(students ?? catalog.student_count, fees ?? catalog.average_fees, "operator", {
    sheet_rank: catalog.sheet_rank,
    size_label: catalog.size_label,
  });
}

export function compareSizeFees(a: SizeFees, b: SizeFees): number {
  const aRank = a.sheet_rank ?? 9999;
  const bRank = b.sheet_rank ?? 9999;
  if (aRank !== bRank) return aRank - bRank;
  if (b.term_book !== a.term_book) return b.term_book - a.term_book;
  if (b.student_count !== a.student_count) return b.student_count - a.student_count;
  if (b.average_fees !== a.average_fees) return b.average_fees - a.average_fees;
  return 0;
}

export function rankSchools<T extends { school_name: string; student_count?: number | null; average_fees?: number | null }>(
  rows: T[],
): Array<T & { size_fees: SizeFees; size_rank: number }> {
  return [...rows]
    .map((row) => ({
      ...row,
      size_fees: resolveSizeFees(row.school_name, row),
    }))
    .sort((a, b) => {
      const bySize = compareSizeFees(a.size_fees, b.size_fees);
      if (bySize) return bySize;
      return a.school_name.localeCompare(b.school_name);
    })
    .map((row, index) => ({
      ...row,
      size_rank: row.size_fees.sheet_rank ?? index + 1,
    }));
}

export function sortRanked<T extends { school_name: string; size_fees: SizeFees; size_rank: number }>(
  rows: T[],
  sort: SizeSort,
): T[] {
  const copy = [...rows];
  if (sort === "students") {
    return copy.sort((a, b) => {
      if (b.size_fees.student_count !== a.size_fees.student_count) {
        return b.size_fees.student_count - a.size_fees.student_count;
      }
      return a.school_name.localeCompare(b.school_name);
    });
  }
  if (sort === "fees") {
    return copy.sort((a, b) => {
      if (b.size_fees.average_fees !== a.size_fees.average_fees) {
        return b.size_fees.average_fees - a.size_fees.average_fees;
      }
      return a.school_name.localeCompare(b.school_name);
    });
  }
  if (sort === "name") {
    return copy.sort((a, b) => a.school_name.localeCompare(b.school_name));
  }
  return copy.sort((a, b) => a.size_rank - b.size_rank);
}

export function formatNaira(value: number | null | undefined): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString("en-NG")}`;
}

export function formatStudents(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("en-NG")} students`;
}

export function formatStudentRange(row: SizeFees): string {
  if (row.source === "operator" || row.student_low === row.student_high) {
    return formatStudents(row.student_count);
  }
  return `${row.student_low.toLocaleString("en-NG")}–${row.student_high.toLocaleString("en-NG")} students`;
}

export function formatFeeRange(row: SizeFees): string {
  if (row.source === "operator" || row.fee_low === row.fee_high) {
    return `${formatNaira(row.average_fees)} / term`;
  }
  return `${formatNaira(row.fee_low)}–${formatNaira(row.fee_high)} / term`;
}
