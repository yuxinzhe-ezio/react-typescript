import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { PROJECT_BUILD_CONFIGS, type BuildEnv } from '../../packages/configs/src/build';

export type DeployEnvName = 'dev' | 'test' | 'test1' | 'test2' | 'test3' | 'prod';

export const getEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

export const pickDeployEnv = (branchName?: string, explicitEnv?: string): DeployEnvName => {
  if (explicitEnv === 'prod' || explicitEnv === 'dev' || explicitEnv === 'test')
    return explicitEnv as DeployEnvName;
  switch (branchName) {
    case 'master':
    case 'main':
      return 'prod';
    case 'dev':
      return 'dev';
    case 'test':
      return 'test';
    case 'test1':
      return 'test1';
    case 'test2':
      return 'test2';
    case 'test3':
      return 'test3';
    default:
      return 'dev';
  }
};

export const mergeProjectEnv = (project: string, envName: DeployEnvName): BuildEnv => {
  const cfg = PROJECT_BUILD_CONFIGS[project as keyof typeof PROJECT_BUILD_CONFIGS];
  if (!cfg) return {};
  return { ...(cfg.envCommon || {}), ...((cfg.envPerEnv && cfg.envPerEnv[envName]) || {}) };
};

export const appendEnvToGithubEnv = (env: Record<string, string | undefined>): void => {
  const ghEnv = process.env.GITHUB_ENV;
  if (!ghEnv) return;
  const lines = Object.entries(env)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .map(([k, v]) => `${k}=${v as string}`)
    .join('\n');
  if (lines) appendFileSync(ghEnv, `\n${lines}\n`);
};

// CLI entry: when executed directly, read PROJECT/BRANCH_NAME/ENV_NAME and append to $GITHUB_ENV
const main = async (): Promise<void> => {
  const project = process.env.PROJECT || '';
  if (!project) return;
  const branchName = process.env.BRANCH_NAME;
  const explicitEnv = process.env.ENV_NAME;
  const envName = pickDeployEnv(branchName, explicitEnv);
  const merged = mergeProjectEnv(project, envName);
  appendEnvToGithubEnv(merged);
};

try {
  const isDirect = import.meta.url === pathToFileURL(process.argv[1] || '').href;
  if (isDirect) {
    main().catch(err => {
      process.stderr.write(String(err?.stack || err) + '\n');
      process.exit(1);
    });
  }
} catch {
  // allow importing without side effects
}
