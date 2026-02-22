import { loadEnv } from "./env.js";
import { parseCSV } from "./csv.js";
import { downloadRow, fileAlreadyExists } from "./download.js";
import { randomDelay } from "./delay.js";
import { closeExiftool } from "./exif.js";
import { MediaFormat } from "./types.js";

const PROCESS_FORMATS: MediaFormat[] = [MediaFormat.Photo];

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
  console.log(`Found ${rows.length} total rows.\n`);

  let downloaded = 0;
  let skipped = 0;
  let duplicates = 0;
  let failed = 0;

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!PROCESS_FORMATS.includes(row.format)) {
        console.log(
          `[${i + 1}/${rows.length}] Skipping (${row.format}) ${row.commonName} ML${row.mlNumber}`,
        );
        skipped++;
        continue;
      }

      if (fileAlreadyExists(row)) {
        console.log(
          `[${i + 1}/${rows.length}] Skipping (exists) ${row.commonName} ML${row.mlNumber}`,
        );
        duplicates++;
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
    console.log(`\nDone!`);
    console.log(`  Downloaded: ${downloaded}`);
    console.log(`  Duplicates:    ${duplicates}`);
    console.log(`  Skipped:    ${skipped}`);
    console.log(`  Failed:     ${failed}`);
    await closeExiftool();
  }
}

main();
