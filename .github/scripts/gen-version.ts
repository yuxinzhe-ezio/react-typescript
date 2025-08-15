import { execSync } from 'node:child_process';

function getLatestTag(): string {
  try {
    execSync('git fetch --tags', { stdio: 'ignore' });
    const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return tag || 'v0.0.0';
  } catch {
    return 'v0.0.0';
  }
}

function parseSemver(tag: string): [number, number, number] {
  const version = tag.startsWith('v') ? tag.slice(1) : tag;
  const [majorStr, minorStr, patchStr] = version.split('.');
  const major = Number(majorStr) || 0;
  const minor = Number(minorStr) || 0;
  const patch = Number(patchStr) || 0;
  return [major, minor, patch];
}

function resolveBranchName(): string {
  const headRef = process.env.GITHUB_HEAD_REF;
  if (headRef && headRef.length > 0) {
    return headRef;
  }
  const refName = process.env.GITHUB_REF_NAME;
  if (refName && refName.length > 0) {
    return refName;
  }
  const ref = process.env.GITHUB_REF || '';
  if (ref.startsWith('refs/heads/')) {
    return ref.replace('refs/heads/', '');
  }
  return ref || 'unknown';
}

function buildVersion(): string {
  const latestTag = getLatestTag();
  const [major] = parseSemver(latestTag);
  let [, minor, patch] = parseSemver(latestTag);
  const branch = resolveBranchName();
  const runNumber = process.env.GITHUB_RUN_NUMBER || '0';

  let suffix = '';

  if (branch.startsWith('feature/')) {
    minor += 1;
    patch = 0;
    suffix = `-alpha.${runNumber}`;
  } else if (branch.startsWith('hotfix/')) {
    patch += 1;
    suffix = `-hotfix.${runNumber}`;
  } else if (branch.startsWith('release/')) {
    minor += 1;
    patch = 0;
  } else if (branch === 'master') {
    patch += 1;
  }

  return `v${major}.${minor}.${patch}${suffix}`;
}

const finalVersion = buildVersion();
process.stdout.write(finalVersion);

