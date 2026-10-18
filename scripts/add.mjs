// Usage: node scripts/add.mjs candidates.json
// candidates.json: [{ "repo": "owner/name", "category": "dev", "description": "Own words, one sentence." }]
import { readFileSync } from 'node:fs';
import { CATEGORIES, fetchRepo, load, problems, save, today } from './lib.mjs';

const candidates = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const repos = load('repos.json');
const removed = load('removed.json');
const seen = new Set([...repos, ...removed].flatMap((r) => [String(r.id), r.repo.toLowerCase()]));
const categories = new Set(CATEGORIES.map(([slug]) => slug));
let added = 0;

for (const c of candidates) {
  const meta = fetchRepo(c.repo);
  const issues = problems(meta, { adding: true });
  const d = (c.description ?? '').trim();
  if (!categories.has(c.category)) issues.push(`unknown category ${c.category}`);
  if (d.length < 20 || d.length > 120) issues.push('description must be 20-120 characters');
  if (!/^[A-Z].*\.$/.test(d)) issues.push('description must be one sentence ending with a full stop');
  if (/https?:|www\.|[\u{1F300}-\u{1FAFF}]/u.test(d)) issues.push('no links or emoji in descriptions');
  if (meta && d.toLowerCase() === (meta.description ?? '').trim().toLowerCase()) issues.push('description copied from the repo');
  if (meta && (seen.has(String(meta.id)) || seen.has(meta.full_name.toLowerCase()))) issues.push('duplicate or previously removed');
  if (issues.length) {
    console.log(`REJECTED ${c.repo}: ${issues.join('; ')}`);
    continue;
  }
  repos.push({
    id: meta.id,
    repo: meta.full_name,
    url: meta.html_url,
    category: c.category,
    description: d,
    license: meta.license.spdx_id,
    added: today(),
  });
  seen.add(String(meta.id)).add(meta.full_name.toLowerCase());
  added++;
  console.log(`ADDED ${meta.full_name} (${meta.license.spdx_id}, ${meta.stargazers_count} stars) | GitHub says: ${meta.description ?? ''}`);
}

save('repos.json', repos);
console.log(`${added} added, ${repos.length} listed`);
