import { appendFileSync } from 'node:fs';
import { PROJECT_BUILD_CONFIGS } from '../../packages/configs/src/build';
import { execSync } from 'node:child_process';

const all = Object.entries(PROJECT_BUILD_CONFIGS).map(([key, cfg]) => ({
  key: key,
  project: cfg.projectPath,
  cf: cfg.cloudflareProject,
}));

const ensureRefExists = (ref: string): void => {
  try {
    // Check if ref exists locally
    execSync(`git cat-file -e ${ref}`, { stdio: ['ignore', 'ignore', 'ignore'] });
  } catch {
    console.log(`Reference ${ref} not found locally, fetching...`);
    try {
      // Try to fetch the specific commit
      execSync(`git fetch origin ${ref}`, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      console.log(`Failed to fetch ${ref}, trying with full depth...`);
      // Fallback: fetch with more depth
      execSync(`git fetch --depth=10 origin`, { stdio: ['ignore', 'pipe', 'pipe'] });
    }
  }
};

const getChangedFileNames = (baseRef: string, headRef: string): string[] => {
  // Ensure both refs exist before attempting diff
  ensureRefExists(baseRef);
  ensureRefExists(headRef);

  const out = execSync(`git diff --name-only ${baseRef} ${headRef}`, {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim();
  return out ? out.split('\n') : [];
};

const getChangedFiles = (): string[] => {
  const lastRef = process.env.LAST_SHA || '';
  const headRef = process.env.HEAD_SHA || '';

  console.log(`Comparing changes: ${lastRef} -> ${headRef}`);

  try {
    if (lastRef && headRef && lastRef !== headRef) {
      const changes = getChangedFileNames(lastRef, headRef);
      console.log(`Found ${changes.length} changed files:`, changes);
      return changes;
    }
    console.log('No valid comparison available, returning empty list');
    return [];
  } catch (error) {
    console.error('Error getting changed files:', error);
    return [];
  }
};

const changed = getChangedFiles();

const include = changed.length
  ? all.filter(({ project }) => changed.some(f => f.startsWith(`${project}/`)))
  : [];

console.log(`Projects with changes: ${include.map(i => i.key).join(', ') || 'none'}`);

const pairs = include.map(i => `${i.key},${i.cf}`).join('|');
const pairsLine = `pairs=${pairs.replace(/%/g, '%25').replace(/\n/g, '%0A').replace(/\r/g, '%0D')}`;
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `\n${pairsLine}\n`);
}
