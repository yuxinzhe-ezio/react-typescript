import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { PROJECT_BUILD_CONFIGS } from '../../packages/configs/src/build';
import { pickDeployEnv, getEnv } from './env';

const run = (cmd: string, opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void => {
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd, env: { ...process.env, ...(opts.env || {}) } });
};

// Deployment notification payload
interface DeploymentNotification {
  status: 'success' | 'failure';
  projectName: string;
  version: string;
  branchName: string;
  region: string;
  trigger: string;
  openMessageId?: string;
  errorMessage?: string;
}

// Notify deployment result via both webhook and callback
const notifyDeploymentResult = async (notification: DeploymentNotification): Promise<void> => {
  const { status, projectName, version, branchName, region, trigger, openMessageId, errorMessage } =
    notification;

  // Get PR information from GitHub Actions environment
  const prNumber = process.env.PR_NUMBER ? parseInt(process.env.PR_NUMBER, 10) : undefined;
  const prUrl = process.env.PR_URL;

  // Get Cloudflare URLs for deployment
  let previewUrl: string | undefined;
  let aliasUrl: string | undefined;

  try {
    const apiToken = getEnv('CLOUDFLARE_API_TOKEN');
    const accountId = getEnv('CLOUDFLARE_ACCOUNT_ID');

    if (apiToken && accountId && projectName) {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=1`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      );

      if (res.ok) {
        const data = (await res.json()) as
          | { result: { url: string; aliases: string[] }[] }
          | undefined;
        const latest = data?.result?.[0];
        previewUrl = latest?.url;
        aliasUrl = latest?.aliases?.[0];
      }
    }
  } catch (error) {
    console.warn('Failed to fetch Cloudflare deployment URLs:', error);
  }

  // Send callback notification to node-service (if openMessageId exists)
  if (openMessageId) {
    try {
      const response = await fetch(
        'http://35.91.205.249:8080/lark/callback/update-deployment-status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            open_message_id: openMessageId,
            status,
            branch_name: branchName,
            region,
            trigger,
            project_name: projectName,
            version,
            action_url: process.env.GITHUB_RUN_URL,
            ...(previewUrl && { preview_url: previewUrl }),
            ...(aliasUrl && { alias_url: aliasUrl }),
            ...(prNumber && { pr_number: prNumber }),
            ...(prUrl && { pr_url: prUrl }),
            ...(errorMessage && { error_message: errorMessage }),
          }),
        }
      );

      if (!response.ok) {
        console.warn(`Failed to send callback: ${response.status}`);
      } else {
        console.log('✅ Successfully notified deployment status');
      }
    } catch (error) {
      console.warn(`Callback error:`, error);
    }
  }
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
    await notifyDeploymentResult({
      status: 'success',
      projectName: cf,
      version: process.env.VERSION || '',
      branchName: process.env.BRANCH_NAME || '',
      region: process.env.REGION || '',
      trigger: process.env.MODE || '',
      openMessageId: process.env.OPEN_MESSAGE_ID,
    });
  }
};

main().catch(async err => {
  const errorMessage = String(err?.stack || err);
  process.stderr.write(errorMessage + '\n');

  // Notify deployment failure
  await notifyDeploymentResult({
    status: 'failure',
    projectName: process.env.CF_PAGES_PROJECT || 'Unknown',
    version: process.env.VERSION || '',
    branchName: process.env.BRANCH_NAME || '',
    region: process.env.REGION || '',
    trigger: process.env.MODE || '',
    openMessageId: process.env.OPEN_MESSAGE_ID,
    errorMessage,
  });

  process.exit(1);
});
