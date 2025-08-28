import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { PROJECT_BUILD_CONFIGS } from '../../packages/configs/src/build';
import { pickDeployEnv } from './env';
import { sendInteractive, buildDefaultText, getEnv } from './send-lark';

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
  messageId?: string;
  errorMessage?: string;
}

// Notify deployment result via both webhook and callback
const notifyDeploymentResult = async (notification: DeploymentNotification): Promise<void> => {
  const { status, projectName, version, branchName, region, trigger, messageId, errorMessage } =
    notification;

  // Send webhook notification (existing send-lark logic)
  const webhook = process.env.LARK_WEBHOOK_URL;
  if (webhook) {
    process.env.JOB_STATUS = status;
    process.env.CF_PAGES_PROJECT = projectName;
    process.env.BRANCH_NAME = branchName;
    const title = `${projectName} (${version})`;
    const text =
      status === 'failure' && errorMessage
        ? `${buildDefaultText()}\n\n**Error:** ${errorMessage}`
        : buildDefaultText();

    await sendInteractive(webhook, title, text);
  }

  // Send callback notification to node-service (if messageId exists)
  if (messageId) {
    const callbackUrl = process.env.LARK_CALLBACK_URL;
    if (callbackUrl) {
      try {
        const response = await fetch(`${callbackUrl}/lark/callback/update-deployment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: messageId,
            status,
            branch_name: branchName,
            region,
            trigger,
            project_name: projectName,
            version,
            action_url: process.env.GITHUB_RUN_URL,
            ...(errorMessage && { error_message: errorMessage }),
          }),
        });

        if (!response.ok) {
          console.warn(`Failed to send callback: ${response.status}`);
        }
      } catch (error) {
        console.warn(`Callback error:`, error);
      }
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
      messageId: process.env.MESSAGE_ID,
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
    messageId: process.env.MESSAGE_ID,
    errorMessage,
  });

  process.exit(1);
});
