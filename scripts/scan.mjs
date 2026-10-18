// Blocks commits that contain secrets, personal data, unexpected files or GitHub Actions.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { ROOT } from './lib.mjs';

const ALLOWED_FILES = /^(README\.md|LICENSE|CONTRIBUTING\.md|SECURITY\.md|\.gitignore|data\/(repos|removed|meta)\.json|scripts\/[a-z-]+\.mjs)$/;
const join = (...p) => p.join('');
const NOREPLY = join('39303292+ShushantLakhyani', '@', 'users.noreply.github.com');

const PATTERNS = [
  [/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/sk-[A-Za-z0-9_-]{20,}/, 'API key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS key'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google key'],
  [/xox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/(ntn|secret)_[A-Za-z0-9]{20,}/, 'Notion token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\/Users\/|\/home\/[a-z]/, 'local file path'],
  [new RegExp(join('s', 'lakhyani'), 'i'), 'personal email name'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/, 'email address'],
  [/\+\d{1,3}[\s-]?\d{8,12}\b|\b[6-9]\d{9}\b/, 'phone number'],
  [new RegExp(join('\\b', 'B', 'PR', '\\b')), 'abbreviated site name'],
  [new RegExp(join('peak ', 'influence'), 'i'), 'client name'],
];

const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const errors = [];

for (const f of files) {
  if (!ALLOWED_FILES.test(f)) { errors.push(`${f}: file not on the allowlist`); continue; }
  if (statSync(ROOT + f).size > 1_000_000) errors.push(`${f}: larger than 1 MB`);
  if (f === 'LICENSE') continue;
  const text = readFileSync(ROOT + f, 'utf8');
  for (const [re, label] of PATTERNS) {
    const lines = text.split('\n');
    lines.forEach((line, i) => { if (re.test(line)) errors.push(`${f}:${i + 1}: ${label}`); });
  }
}

const email = execFileSync('git', ['config', 'user.email'], { cwd: ROOT, encoding: 'utf8' }).trim();
if (email !== NOREPLY) errors.push(`git user.email must be the GitHub noreply address, not ${email}`);
let authors = [];
try { authors = execFileSync('git', ['log', '--format=%ae%n%ce'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean); } catch {}
for (const a of new Set(authors)) if (a !== NOREPLY) errors.push(`commit history contains a non-noreply email`);

if (errors.length) {
  console.error('SCAN FAILED\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`scan ok (${files.length} files)`);
