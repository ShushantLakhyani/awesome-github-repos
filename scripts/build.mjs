// Generates README.md from data/repos.json. Usage: node scripts/build.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { CATEGORIES, LICENSES, MAX_IDLE_DAYS_ADD, MIN_STARS_ADD, ROOT, load } from './lib.mjs';

const repos = load('repos.json');
const meta = load('meta.json');
const used = CATEGORIES.filter(([slug]) => repos.some((r) => r.category === slug));

const lines = [
  '# Awesome GitHub Repos',
  '',
  'A hand-picked list of useful, open-source GitHub repositories. Every repo is checked against the same safety rules before it is listed, and the whole list is re-checked every day.',
  '',
  `${repos.length} repos · last checked ${meta.lastVerified}`,
  '',
  '> **Please read:** every repo here is owned and maintained by someone else. Listing is not an endorsement or a guarantee. Always review code and its licence yourself before you install or run it. Use at your own risk.',
  '',
  '## Contents',
  '',
  ...used.map(([slug, title]) => `- [${title}](#${slug})`),
  '- [How repos are picked](#how-repos-are-picked)',
  '- [Removal requests and reports](#removal-requests-and-reports)',
  '',
];

for (const [slug, title] of used) {
  lines.push(`<a id="${slug}"></a>`, `## ${title}`, '');
  for (const r of repos.filter((x) => x.category === slug).sort((a, b) => a.repo.localeCompare(b.repo))) {
    lines.push(`- [${r.repo}](${r.url}) - ${r.description} \`${r.license}\``);
  }
  lines.push('');
}

lines.push(
  '## How repos are picked',
  '',
  '- Public, open-source and not a fork or archived.',
  `- An open-source licence: ${[...LICENSES].join(', ')}.`,
  `- At least ${MIN_STARS_ADD} stars and active within the last ${MAX_IDLE_DAYS_ADD} days when added.`,
  '- No piracy, downloaders, scrapers, paywall or captcha bypassing, hacking tools, account bots, deepfakes, adult content, gambling, trading or crypto.',
  '- Descriptions are written fresh for this list, not copied from the repo.',
  '- Repos that stop meeting these rules, change owner or get archived are removed automatically.',
  '',
  '## Removal requests and reports',
  '',
  '- Own a listed repo and want it removed? Open an issue with the repo name and it will be removed, no questions asked.',
  '- Spotted something unsafe, wrong or broken? Open an issue, or report privately through the Security tab. See [SECURITY.md](SECURITY.md).',
  '- Suggestions are welcome as issues. Pull requests are not merged; every entry goes through the same checks.',
  '',
  '## Licence',
  '',
  'The list itself is released under [CC0 1.0](LICENSE). Each listed repo keeps its own licence.',
  '',
  'Curated by Shushant Lakhyani, building [bestproductivityresources.com](https://bestproductivityresources.com).',
  '',
);

const readme = lines.join('\n');
const path = `${ROOT}README.md`;
if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(path, 'utf8'); } catch {}
  if (current !== readme) { console.error('README.md is out of date: run node scripts/build.mjs'); process.exit(1); }
} else {
  writeFileSync(path, readme);
  console.log(`README.md written (${repos.length} repos)`);
}
