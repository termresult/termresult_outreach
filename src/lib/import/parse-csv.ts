export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsv(text);
  const header = rows.shift();
  if (!header) return [];
  const keys = header.map((cell) => cell.trim());
  return rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      keys.forEach((key, i) => {
        record[key] = row[i] ?? "";
      });
      return record;
    });
}

function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}
