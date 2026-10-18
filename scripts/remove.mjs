// Usage: node scripts/remove.mjs owner/name "removal request"
import { load, save, today } from './lib.mjs';

const [name, reason = 'removal request'] = process.argv.slice(2);
const repos = load('repos.json');
const entry = repos.find((r) => r.repo.toLowerCase() === name?.toLowerCase());
if (!entry) { console.log(`${name} is not listed`); process.exit(0); }
save('repos.json', repos.filter((r) => r !== entry));
const removed = load('removed.json');
removed.push({ id: entry.id, repo: entry.repo, removed: today(), reason });
save('removed.json', removed);
console.log(`removed ${entry.repo}`);
