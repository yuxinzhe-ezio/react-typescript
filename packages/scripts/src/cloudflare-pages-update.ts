import { CLOUDFLARE_API_BASE, me } from './constants/cloudflare';

const { DEFAULT_ACCOUNT_ID, DEFAULT_CLOUDFLARE_API_TOKEN, DEFAULT_PROJECT_NAME } = me;

type UpdateProjectBody = {
  name: string;
  production_branch: string;
};

async function testValid(): Promise<Response> {
  const apiToken = DEFAULT_CLOUDFLARE_API_TOKEN;

  // const url = `${CLOUDFLARE_API_BASE}/user/tokens/verify`;
  // const url = `${CLOUDFLARE_API_BASE}/accounts/${DEFAULT_ACCOUNT_ID}/tokens/verify`
  // const url = `${CLOUDFLARE_API_BASE}/user/tokens/${DEFAULT_CLOUDFLARE_API_TOKEN_ID}`
  // const url = `${CLOUDFLARE_API_BASE}/accounts/${DEFAULT_ACCOUNT_ID}/pages`
  const url = `${CLOUDFLARE_API_BASE}/accounts/${DEFAULT_ACCOUNT_ID}/pages/projects`;
  // const url = `${CLOUDFLARE_API_BASE}/accounts/${DEFAULT_ACCOUNT_ID}/pages/projects/${DEFAULT_PROJECT_NAME}/domains`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  };

  return fetch(url, {
    method: 'GET',
    headers,
  });
}

export async function updateCloudflarePagesProject(body: UpdateProjectBody): Promise<Response> {
  const accountId = DEFAULT_ACCOUNT_ID;
  const projectName = DEFAULT_PROJECT_NAME;
  const apiToken = DEFAULT_CLOUDFLARE_API_TOKEN;

  const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
  };

  return fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

async function main() {
  // const payload: UpdateProjectBody = {
  //   name: 'NextJS Blog',
  //   production_branch: 'main',
  // };

  try {
    const test = await testValid();
    const text = await test.text();
    // const res = await updateCloudflarePagesProject(payload);
    // const text = await res.text();

    if (!test.ok) {
      process.stderr.write(text + '\n');
      process.exit(1);
    }

    process.stdout.write(text + '\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + '\n');
    process.exit(1);
  }
}

void main();
