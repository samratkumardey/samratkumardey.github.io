/**
 * Refresh data/metrics.json from OpenAlex.
 *
 * Run by .github/workflows/update-metrics.yml on a nightly schedule, and
 * manually from the Actions tab. Requires Node 18+ (for global fetch);
 * no npm dependencies.
 *
 *   node scripts/update-metrics.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = require(path.join(root, 'assets/js/metrics-core.js'));

const readJSON = async (p) => JSON.parse(await readFile(path.join(root, p), 'utf8'));

const site = await readJSON('data/site.json');
const pubs = await readJSON('data/publications.json');

const authorId = site?.meta?.openAlexAuthorId;
if (!authorId) {
  console.error('No meta.openAlexAuthorId in data/site.json — nothing to do.');
  process.exit(0);
}

console.log(`Fetching OpenAlex works for ${authorId}…`);
const metrics = await core.build(pubs, authorId);

const t = metrics.totals;
console.log(`  candidate works on the OpenAlex profile : ${t.candidateWorks}`);
console.log(`  matched to this site's publication list : ${t.matchedWorks} / ${t.publications}`);
console.log(`  citations : ${t.citations}   h-index : ${t.hIndex}   i10 : ${t.i10Index}`);
if (metrics.unmatched.length) {
  console.log(`  no OpenAlex record found for: ${metrics.unmatched.join(', ')}`);
}

// Report papers on the OpenAlex profile that are NOT on the site yet, so new
// work does not silently go missing from the publication list. Informational
// only — nothing is added automatically, because the profile also contains
// papers by other people with the same name.
const works = await core.fetchWorks(authorId);
const known = new Set(pubs.map((p) => core.normTitle(p.title)));
const missing = works
  .filter((w) => w.cited_by_count > 0 && !known.has(core.normTitle(w.title)))
  .filter((w) => !/^author response for|^withdrawn:/i.test(w.title || ''))
  .sort((a, b) => b.publication_year - a.publication_year)
  .slice(0, 25)
  .map((w) => ({
    title: w.title,
    year: w.publication_year,
    citations: w.cited_by_count,
    doi: w.doi,
  }));
metrics.candidatesNotOnSite = missing;
if (missing.length) {
  console.log(`\n  ${missing.length} cited work(s) on the OpenAlex profile are not in publications.json.`);
  console.log('  Review them in metrics.json -> candidatesNotOnSite (some may be other authors).');
}

// Do not rewrite the file when only the timestamp would change — that keeps the
// git history meaningful instead of one empty commit per night.
let previous = null;
try { previous = await readJSON('data/metrics.json'); } catch { /* first run */ }
const strip = (o) => { if (!o) return null; const c = { ...o }; delete c.updated; return JSON.stringify(c); };
if (previous && strip(previous) === strip(metrics)) {
  console.log('\nNo change since the last run — leaving data/metrics.json alone.');
  process.exit(0);
}

await writeFile(path.join(root, 'data/metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
console.log('\nWrote data/metrics.json');
