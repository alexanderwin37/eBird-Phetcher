import { mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { MediaRow, EnvConfig } from "./types.js";
import { writeExifIfMissing } from "./exif.js";

const OUTPUT_DIR = join(import.meta.dirname, "..", "inout", "photos");
const ORIGINAL_URL_BASE =
  "https://macaulaylibrary.org/internal/v1/original-url";

export function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "_").replace(/_+/g, "_");
}

export function getFilePath(row: MediaRow): string {
  return join(
    OUTPUT_DIR,
    row.date,
    `${sanitize(row.commonName)}_ML${row.mlNumber}.jpg`,
  );
}

export async function downloadRow(
  row: MediaRow,
  index: number,
  total: number,
  env: EnvConfig,
): Promise<boolean> {
  const filePath = getFilePath(row);
  const dirPath = join(OUTPUT_DIR, row.date);

  mkdirSync(dirPath, { recursive: true });

  console.log(
    `[${index + 1}/${total}] Downloading ${row.commonName} ML${row.mlNumber}...`,
  );

  const urlResponse = await fetch(`${ORIGINAL_URL_BASE}/${row.mlNumber}`, {
    headers: { Cookie: env.cookie, "User-Agent": env.userAgent },
    redirect: "manual",
  });

  let downloadUrl: string;

  if (urlResponse.status >= 300 && urlResponse.status < 400) {
    downloadUrl = urlResponse.headers.get("location") ?? "";
  } else if (urlResponse.ok) {
    downloadUrl = (await urlResponse.text()).trim();
  } else {
    console.error(`  Failed to get original URL (${urlResponse.status})`);
    return false;
  }

  if (!downloadUrl) {
    console.error(`  Could not determine download URL`);
    return false;
  }

  const imageResponse = await fetch(downloadUrl, {
    headers: { "User-Agent": env.userAgent },
  });
  if (!imageResponse.ok) {
    console.error(`  Failed to download image (${imageResponse.status})`);
    return false;
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  await writeFile(filePath, buffer);
  await writeExifIfMissing(filePath, row);
  return true;
}
