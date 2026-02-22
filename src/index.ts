import { existsSync } from "fs";
import { loadEnv } from "./env.js";
import { parseCSV } from "./csv.js";
import { downloadRow, getFilePath } from "./download.js";
import { randomDelay } from "./delay.js";
import { closeExiftool } from "./exif.js";

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await closeExiftool();
    process.exit(0);
  });
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

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (existsSync(getFilePath(row))) {
        console.log(
          `[${i + 1}/${rows.length}] Skipping ${row.commonName} ML${row.mlNumber} (exists)`,
        );
        skipped++;
      } else {
        try {
          const success = await downloadRow(row, i, rows.length, env);
          if (success) {
            downloaded++;
          } else {
            failed++;
          }
          await randomDelay();
        } catch (err) {
          console.error(`  Error: ${err}`);
          failed++;
        }
      }
    }
  } finally {
    console.log(
      `\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`,
    );
    await closeExiftool();
  }
}

main();
