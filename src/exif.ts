import { exiftool } from "exiftool-vendored";
import type { MediaRow } from "./types.js";

export async function writeExifIfMissing(
  filePath: string,
  row: MediaRow,
): Promise<void> {
  const existing = await exiftool.read(filePath);
  const tags: Record<string, unknown> = {};

  const timeStr = row.time.padStart(4, "0");
  const dateTime = `${row.date} ${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00`;

  if (!existing.DateTimeOriginal) {
    tags.DateTimeOriginal = dateTime;
  }

  if (!existing.CreateDate) {
    tags.CreateDate = dateTime;
  }

  if (!existing.GPSLatitude && !isNaN(row.latitude)) {
    tags.GPSLatitude = row.latitude;
    tags.GPSLatitudeRef = row.latitude >= 0 ? "N" : "S";
  }

  if (!existing.GPSLongitude && !isNaN(row.longitude)) {
    tags.GPSLongitude = row.longitude;
    tags.GPSLongitudeRef = row.longitude >= 0 ? "E" : "W";
  }

  if (Object.keys(tags).length > 0) {
    await exiftool.write(filePath, tags, {
      writeArgs: ["-overwrite_original"],
    });
  }
}

export async function closeExiftool(): Promise<void> {
  console.log("Closing exiftool...");
  await exiftool.end();
}
