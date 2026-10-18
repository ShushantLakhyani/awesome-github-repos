// Shared rules for adding and re-checking listed repos.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export const ROOT = new URL('..', import.meta.url).pathname;
export const OWN_ACCOUNT = 'shushantlakhyani';

// OSI-approved / public-domain licences only. "Other" and custom licences are never listed.
export const LICENSES = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'Unlicense',
  'CC0-1.0', '0BSD', 'Zlib', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'AGPL-3.0', 'EPL-2.0',
]);

export const CATEGORIES = [
  ['ai', 'AI and language models'],
  ['dev', 'Developer tools'],
  ['productivity', 'Productivity and notes'],
  ['design', 'Design and UI'],
  ['self-hosted', 'Self-hosted apps'],
  ['data', 'Data and visualization'],
  ['learning', 'Learning'],
  ['utilities', 'Utilities'],
];

export const MIN_STARS_ADD = 500;
export const MIN_STARS_KEEP = 250;
export const MAX_IDLE_DAYS_ADD = 180;
export const MAX_IDLE_DAYS_KEEP = 365;

// Topics we never list: piracy, downloaders, scraping, bypassing, hacking, account bots,
// deepfakes, adult content, gambling, trading/crypto, surveillance.
export const BLOCKED = [
  /download(er|ers)?\b/i, /youtube-?dl|yt-?dlp/i, /torrent/i, /pira(cy|te)/i, /\bcrack(s|ed|er)?\b/i,
  /keygen/i, /warez/i, /bypass/i, /paywall/i, /captcha/i, /scrap(e|er|ers|ing)\b/i, /crawl(er|ing)/i,
  /spider\b/i, /\bhack(s|ing|er|ers)?\b/i, /exploit/i, /pentest/i, /payload/i, /malware/i,
  /ransomware/i, /keylog/i, /stealer/i, /phish/i, /ddos/i, /botnet/i, /\brat\b/i, /\bc2\b/i,
  /deep-?fake/i, /face-?swap/i, /voice-?clon/i, /undress/i, /nsfw/i, /porn/i, /\bnude/i, /\badult\b/i,
  /gambl/i, /casino/i, /betting/i, /\btrading\b/i, /crypto/i, /airdrop/i, /\bwallet/i, /\btoken sale/i,
  /spam/i, /mass[- ]?(dm|message)/i, /follower/i, /auto-?(like|follow)/i, /(instagram|tiktok|twitter|discord|telegram|whatsapp)[- ]?bot/i,
  /aimbot/i, /\bcheat/i, /jailbreak/i, /unlock(er)?\b/i, /\bdrm\b/i, /\bproxy\b/i, /\bvpn\b/i,
  /osint/i, /spoof/i, /doxx/i, /surveil/i, /tracker\b/i, /\broms?\b/i,
];

export const today = () => new Date().toLocaleDateString('en-CA');

export const load = (name) => JSON.parse(readFileSync(`${ROOT}data/${name}`, 'utf8'));
export const save = (name, value) => writeFileSync(`${ROOT}data/${name}`, JSON.stringify(value, null, 2) + '\n');

export function fetchRepo(fullName) {
  try {
    const out = execFileSync('gh', ['api', `repos/${fullName}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

const daysSince = (iso) => (Date.now() - Date.parse(iso)) / 86400000;

// Returns a list of problems; empty means the repo meets the listing criteria.
export function problems(meta, { adding }) {
  if (!meta) return ['not found or not public'];
  const out = [];
  const text = [meta.full_name, meta.description ?? '', ...(meta.topics ?? [])].join(' ');
  if (meta.private || meta.visibility !== 'public') out.push('not public');
  if (meta.archived) out.push('archived');
  if (meta.disabled) out.push('disabled');
  if (meta.fork) out.push('fork');
  if (meta.owner?.login?.toLowerCase() === OWN_ACCOUNT) out.push('own repo');
  const spdx = meta.license?.spdx_id;
  if (!LICENSES.has(spdx)) out.push(`licence ${spdx ?? 'none'} not allowed`);
  const minStars = adding ? MIN_STARS_ADD : MIN_STARS_KEEP;
  if (meta.stargazers_count < minStars) out.push(`fewer than ${minStars} stars`);
  const idle = adding ? MAX_IDLE_DAYS_ADD : MAX_IDLE_DAYS_KEEP;
  if (daysSince(meta.pushed_at) > idle) out.push(`no activity for ${idle}+ days`);
  for (const re of BLOCKED) if (re.test(text)) { out.push(`blocked topic (${re.source})`); break; }
  return out;
}
