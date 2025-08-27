export const LARK_APP_ID = 'cli_a826b676ff9c500b';
export const LARK_APP_SECRET = 'UjSbNANXbrjdfi6AQDcpsdYIfAWZUqTA';

export const LARK_BASE_CONFIG = {
  appId: LARK_APP_ID,
  appSecret: LARK_APP_SECRET,
} as const;

export const SERVER_PORT = Number(process.env.PORT || 31017);

export const LARK_TRIGGER_KEYWORDS = ['发布', 'deploy'] as const;
