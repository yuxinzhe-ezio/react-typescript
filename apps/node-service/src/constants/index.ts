export const LARK_APP_ID = 'cli_a826b676ff9c500b';
export const LARK_APP_SECRET = 'UjSbNANXbrjdfi6AQDcpsdYIfAWZUqTA';

export const LARK_BASE_CONFIG = {
  appId: LARK_APP_ID,
  appSecret: LARK_APP_SECRET,
} as const;

export const SERVER_PORT = Number(process.env.PORT || 8080);

export const LARK_TRIGGER_KEYWORDS = ['发布', 'deploy'] as const;

// Deploy related constants
export const DEPLOY_REGIONS = ['global', 'cn'] as const;
export const GITHUB_API_BASE_URL = 'https://api.github.com';

// GitHub Actions constants
export const GITHUB_OWNER = process.env.GITHUB_OWNER || 'yuxinzhe-ezio';
export const GITHUB_REPO = process.env.GITHUB_REPO || 'react-typescript';
export const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  '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';
export const GITHUB_WORKFLOW_ID = process.env.GITHUB_WORKFLOW_ID || 'deploy.yml';
