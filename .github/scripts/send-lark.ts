import {
  LARK_WEBHOOK_URL_ENV,
  MSG_TYPE_INTERACTIVE,
  MSG_TYPE_TEXT,
  ENV_CF_PAGES_PROJECT,
  ENV_CLOUDFLARE_API_TOKEN,
  ENV_CLOUDFLARE_ACCOUNT_ID,
  ENV_JOB_STATUS,
  ENV_GITHUB_RUN_URL,
  ENV_PR_URL,
  ENV_BRANCH_NAME,
} from './constants';
import { pathToFileURL } from 'node:url';
import { pickDeployEnv } from './env';

type MessageType = typeof MSG_TYPE_TEXT | typeof MSG_TYPE_INTERACTIVE;

interface CliArgs {
  type: MessageType;
  text?: string;
  title?: string;
}

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = { type: MSG_TYPE_TEXT };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--type' && i + 1 < argv.length) {
      const t = argv[i + 1] as MessageType;
      if (t === MSG_TYPE_TEXT || t === MSG_TYPE_INTERACTIVE) args.type = t;
      i += 1;
    } else if (arg === '--text' && i + 1 < argv.length) {
      args.text = argv[i + 1];
      i += 1;
    } else if (arg === '--title' && i + 1 < argv.length) {
      args.title = argv[i + 1];
      i += 1;
    }
  }
  return args;
};

const getEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

export const buildDefaultText = (): string => {
  const sha = process.env.GITHUB_SHA ?? '';
  const shortSha = sha ? sha.substring(0, 7) : '';
  const githubServer = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const commitUrl =
    sha && githubServer && repo ? `${githubServer}/${repo}/commit/${sha}` : undefined;
  const prUrl = process.env[ENV_PR_URL];
  const branchLine = process.env[ENV_BRANCH_NAME]
    ? `Branch: ${process.env[ENV_BRANCH_NAME]}`
    : undefined;
  const mrLine = prUrl ? `MR: [${prUrl}](${prUrl})` : undefined;
  const commitLine = shortSha
    ? commitUrl
      ? `Commit: [${shortSha}](${commitUrl})`
      : `commit: ${shortSha}`
    : undefined;
  return [branchLine, mrLine, commitLine].filter(Boolean).join('\n');
};

export const sendText = async (webhook: string, text: string): Promise<void> => {
  const payload = {
    msg_type: MSG_TYPE_TEXT,
    content: { text },
  } as const;
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to send Lark message: ${res.status} ${body}`);
  }
};

const labeledLink = (label: string, url: string | undefined): string | undefined => {
  return url ? `${label}: [${url}](${url})` : undefined;
};

export const sendInteractive = async (
  webhook: string,
  title: string,
  text: string
): Promise<void> => {
  let previewUrl: string | undefined;
  let aliasUrl: string | undefined;
  const jobStatus = getEnv(ENV_JOB_STATUS);
  const runUrl = getEnv(ENV_GITHUB_RUN_URL);
  const actor = process.env.GITHUB_ACTOR;
  const server = process.env.GITHUB_SERVER_URL;
  const actorUrl = actor && server ? `${server}/${actor}` : undefined;

  // If URLs are missing, try to query Cloudflare Pages Deployments API for last deployment
  try {
    const apiToken = getEnv(ENV_CLOUDFLARE_API_TOKEN);
    const accountId = getEnv(ENV_CLOUDFLARE_ACCOUNT_ID);
    const projectName = getEnv(ENV_CF_PAGES_PROJECT) ?? '';
    if (apiToken && accountId) {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=1`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      );
      if (res.ok) {
        const data = (await res.json()) as
          | { result: { url: string; aliases: string[] }[] }
          | undefined;
        const latest = data?.result?.[0];
        previewUrl = latest?.url ?? previewUrl;
        aliasUrl = latest?.aliases?.[0] ?? aliasUrl;
      }
    }
  } catch {
    // ignore fallback failures; we will just omit links if not available
  }

  const envLine = labeledLink(
    'Environment',
    pickDeployEnv(process.env.BRANCH_NAME, process.env.ENV_NAME)
  );
  const previewLine = labeledLink('Preview URL', previewUrl);
  const aliasLine = labeledLink('Alias URL', aliasUrl);
  const linkLines = [envLine, previewLine, aliasLine].filter(Boolean).join('\n');

  const payload = {
    msg_type: MSG_TYPE_INTERACTIVE,
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: jobStatus === 'failure' ? 'red' : jobStatus === 'success' ? 'green' : 'blue',
        title: { tag: 'plain_text', content: title },
      },
      elements: [
        ...(actor
          ? [
              {
                tag: 'div',
                text: {
                  tag: 'lark_md',
                  content: actorUrl
                    ? `Triggered by: [${actor}](${actorUrl})`
                    : `Triggered by: ${actor}`,
                },
              },
            ]
          : []),
        ...(text ? [{ tag: 'div', text: { tag: 'lark_md', content: text } }] : []),
        ...(linkLines ? [{ tag: 'div', text: { tag: 'lark_md', content: linkLines } }] : []),
        ...(runUrl
          ? [
              {
                tag: 'action',
                actions: [
                  {
                    tag: 'button',
                    text: { tag: 'plain_text', content: 'View GitHub Actions Log' },
                    type: 'primary',
                    url: runUrl,
                  },
                ],
              },
            ]
          : []),
      ],
    },
  } as const;
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Failed to send Lark message: ${res.status} ${body}`);
  }
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv);
  const webhook = process.env[LARK_WEBHOOK_URL_ENV];
  if (!webhook) {
    process.stderr.write(`${LARK_WEBHOOK_URL_ENV} not set\n`);
    process.exit(1);
  }

  const text = args.text ?? buildDefaultText();
  if (args.type === MSG_TYPE_TEXT) {
    await sendText(webhook, text);
  } else {
    const title = args.title ?? 'Deployment';
    await sendInteractive(webhook, title, text);
  }
};

// Only run CLI when executed directly
try {
  const isDirect = import.meta.url === pathToFileURL(process.argv[1] || '').href;
  if (isDirect) {
    main().catch(err => {
      process.stderr.write(String(err?.stack || err) + '\n');
      process.exit(1);
    });
  }
} catch {
  // Fallback: always allow importing without side effects
}
