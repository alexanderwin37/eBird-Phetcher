const DELAY_MIN_MS = 400;
const DELAY_MAX_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function randomDelay(): Promise<void> {
  const delay = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  await sleep(delay);
}
