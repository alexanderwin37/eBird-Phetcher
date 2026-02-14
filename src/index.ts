import { createReadStream, existsSync, mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { parse } from "csv-parse";

const PROJECT_ROOT = join(import.meta.dirname, "..");
const CSV_PATH = join(PROJECT_ROOT, "inout", "eBirdPhotoList.csv");
const OUTPUT_DIR = join(PROJECT_ROOT, "inout", "photos");
const ENV_PATH = join(PROJECT_ROOT, ".env");
const ORIGINAL_URL_BASE = "https://macaulaylibrary.org/internal/v1/original-url";
const DELAY_MIN_MS = 400;
const DELAY_MAX_MS = 800;

interface PhotoRow {
  mlNumber: string;
  date: string;
  commonName: string;
}

interface EnvConfig {
  cookie: string;
  userAgent: string;
}

function loadEnv(): EnvConfig {
  if (!existsSync(ENV_PATH)) {
    console.error("Missing .env file. Create one with:\n  USER_AGENT=...\n  EBIRD_COOKIE=...");
    process.exit(1);
  }
  const env = readFileSync(ENV_PATH, "utf-8");
  const cookieMatch = env.match(/^EBIRD_COOKIE=(.+)$/m);
  if (!cookieMatch?.[1]) {
    console.error("EBIRD_COOKIE not found in .env file.");
    process.exit(1);
  }
  const uaMatch = env.match(/^USER_AGENT=(.+)$/m);
  if (!uaMatch?.[1]) {
    console.error("USER_AGENT not found in .env file.");
    process.exit(1);
  }
  return { cookie: cookieMatch[1].trim(), userAgent: uaMatch[1].trim() };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "_").replace(/_+/g, "_");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseCSV(): Promise<PhotoRow[]> {
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

async function downloadPhoto(
  row: PhotoRow,
  index: number,
  total: number,
  env: EnvConfig,
): Promise<boolean> {
  const dirPath = join(OUTPUT_DIR, row.date);
  const fileName = `${sanitize(row.commonName)}_ML${row.mlNumber}.jpg`;
  const filePath = join(dirPath, fileName);

  mkdirSync(dirPath, { recursive: true });

  console.log(`[${index + 1}/${total}] Downloading ${row.commonName} ML${row.mlNumber}...`);

  // Step 1: Get the original download URL
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

  // Step 2: Download the actual image
  const imageResponse = await fetch(downloadUrl, {
    headers: { "User-Agent": env.userAgent },
  });
  if (!imageResponse.ok) {
    console.error(`  Failed to download image (${imageResponse.status})`);
    return false;
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  await writeFile(filePath, buffer);
  return true;
}

async function main(): Promise<void> {
  const env = loadEnv();
  console.log("Config loaded.");

  console.log("Parsing CSV...");
  const rows = await parseCSV();
  console.log(`Found ${rows.length} photos to download.\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const filePath = join(
      OUTPUT_DIR,
      row.date,
      `${sanitize(row.commonName)}_ML${row.mlNumber}.jpg`,
    );

    if (existsSync(filePath)) {
      console.log(`[${i + 1}/${rows.length}] Skipping ${row.commonName} ML${row.mlNumber} (exists)`);
      skipped++;
    } else {
      try {
        const success = await downloadPhoto(row, i, rows.length, env);
        if (success) {
          downloaded++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`  Error: ${err}`);
        failed++;
      }
    }

    if (i < rows.length - 1) {
      const delay = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
      await sleep(delay);
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main();
