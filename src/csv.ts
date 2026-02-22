import { createReadStream } from "fs";
import { join } from "path";
import { parse } from "csv-parse";
import { MediaFormat, type MediaRow } from "./types.js";

const CSV_PATH = join(import.meta.dirname, "..", "inout", "eBirdPhotoList.csv");

export async function parseCSV(): Promise<MediaRow[]> {
  return new Promise((resolve, reject) => {
    const rows: MediaRow[] = [];
    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, relax_column_count: true, bom: true }))
      .on("data", (row: Record<string, string>) => {
        const mlNumber = row["ML Catalog Number"]?.trim();
        const format = row["Format"]?.trim() as MediaFormat;
        const date = row["Date"]?.trim();
        const time = row["Time"]?.trim() || "";
        const commonName = row["Common Name"]?.trim();
        const latitude = parseFloat(row["Latitude"] || "");
        const longitude = parseFloat(row["Longitude"] || "");
        if (mlNumber && format && date && commonName) {
          rows.push({ mlNumber, format, date, time, commonName, latitude, longitude });
        }
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}
