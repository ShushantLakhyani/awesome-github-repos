// Re-checks every listed repo against the listing rules.
// Usage: node scripts/verify.mjs [--fix]   (--fix moves failing repos to data/removed.json)
import { fetchRepo, load, problems, save, today } from './lib.mjs';

const fix = process.argv.includes('--fix');
const repos = load('repos.json');
const removed = load('removed.json');
const keep = [];
let failed = 0;

for (const r of repos) {
  const meta = fetchRepo(r.repo) ?? fetchRepo(`repositories/${r.id}`);
  const issues = problems(meta, { adding: false });
  // A repo that moved to a different owner is treated as a new, unvetted repo.
  if (meta && meta.id !== r.id) issues.push('repo id changed');
  if (meta && meta.owner.login.toLowerCase() !== r.repo.split('/')[0].toLowerCase()) issues.push('owner changed');
  if (issues.length) {
    failed++;
    console.log(`FAIL ${r.repo}: ${issues.join('; ')}`);
    if (fix) removed.push({ id: r.id, repo: r.repo, removed: today(), reason: 'no longer meets the listing criteria' });
    else keep.push(r);
    continue;
  }
  keep.push({ ...r, repo: meta.full_name, url: meta.html_url, license: meta.license.spdx_id });
}

save('repos.json', keep);
save('removed.json', removed);
save('meta.json', { lastVerified: today(), listed: keep.length });
console.log(`${keep.length} listed, ${failed} failing${fix ? ' (removed)' : ''}`);
if (failed && !fix) process.exit(1);
