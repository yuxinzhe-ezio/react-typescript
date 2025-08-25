import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { PROJECT_BUILD_CONFIGS } from '../../packages/configs/src/build';
import { pickDeployEnv } from './env';
import { sendInteractive, buildDefaultText } from './send-lark';

const run = (cmd: string, opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void => {
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd, env: { ...process.env, ...(opts.env || {}) } });
};

const main = async (): Promise<void> => {
  const pairsEnv = process.env.PAIRS || '';
  if (!pairsEnv) return;
  const branchName = process.env.BRANCH_NAME;
  const pairs = pairsEnv.split('|').filter(Boolean);

  for (const item of pairs) {
    const [project, cf] = item.split(',');
    if (!project || !cf) continue;
    process.stdout.write(`Processing ${project} -> ${cf}\n`);

    const envName = pickDeployEnv(branchName, process.env.ENV_NAME);
    const cfg = PROJECT_BUILD_CONFIGS[project as keyof typeof PROJECT_BUILD_CONFIGS];
    if (!cfg) continue;

    const projectPath = cfg.projectPath;

    const merged = {
      ...(cfg.envCommon || {}),
      ...((cfg.envPerEnv && (cfg.envPerEnv as Record<string, Record<string, string>>)[envName]) ||
        {}),
    } as Record<string, string>;

    // Append envs to GITHUB_ENV and also expose to current process for child processes
    if (process.env.GITHUB_ENV) {
      const lines = Object.entries(merged)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
      appendFileSync(process.env.GITHUB_ENV, `\n${lines}\n`);
    }

    // Build
    run('pnpm build', {
      cwd: projectPath,
      env: {
        VERSION: process.env.VERSION || '',
        CF_PAGES_PROJECT: cf,
        ...merged,
      },
    });

    // Deploy via wrangler CLI
    const outDir = merged.OUT_DIR || 'dist';
    run(
      `npx --yes wrangler@^3 pages deploy "${projectPath}/${outDir}" --project-name "${cf}" --branch "${branchName}"`
    );

    // Notify Lark directly via function
    const webhook = process.env.LARK_WEBHOOK_URL;
    if (webhook) {
      process.env.JOB_STATUS = 'success';
      process.env.CF_PAGES_PROJECT = cf;
      await sendInteractive(webhook, `${cf} (${process.env.VERSION || ''})`, buildDefaultText());
    }
  }
};

main().catch(err => {
  process.stderr.write(String(err?.stack || err) + '\n');
  process.exit(1);
});
