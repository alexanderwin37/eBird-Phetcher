import { createReadStream } from "fs";
import { join } from "path";
import { parse } from "csv-parse";
import type { PhotoRow } from "./types.js";

const CSV_PATH = join(import.meta.dirname, "..", "inout", "eBirdPhotoList.csv");

export async function parseCSV(): Promise<PhotoRow[]> {
  return new Promise((resolve, reject) => {
    const rows: PhotoRow[] = [];
    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, relax_column_count: true, bom: true }))
      .on("data", (row: Record<string, string>) => {
        const mlNumber = row["ML Catalog Number"]?.trim();
        const date = row["Date"]?.trim();
        const commonName = row["Common Name"]?.trim();
        if (mlNumber && date && commonName) {
          rows.push({ mlNumber, date, commonName });
        }
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}
