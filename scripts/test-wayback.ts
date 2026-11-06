/**
 * Valida a integração com o Wayback Machine sem subir o app.
 * Consulta 3 sites em 3 datas e loga o resultado.
 *
 * Uso: npx tsx scripts/test-wayback.ts
 */
import { findSnapshot, fetchHeadline } from "../lib/wayback";

const CASES: [string, string][] = [
  ["google.com", "2014-07-07"],
  ["orkut.com", "2009-01-15"],
  ["uol.com.br", "2001-09-11"],
];

async function main() {
  for (const [url, date] of CASES) {
    console.log(`\n=== ${url} @ ${date} ===`);
    const t0 = Date.now();
    const snap = await findSnapshot(url, date);
    if (!snap) {
      console.log("  → sem snapshot");
      continue;
    }
    const ms = Date.now() - t0;
    console.log(`  snapshot: ${snap.snapshotUrl} (status ${snap.status}) [${ms}ms]`);
    const headline = await fetchHeadline(snap, `http://${url}/`);
    console.log(`  headline: ${headline ?? "(não extraída)"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
