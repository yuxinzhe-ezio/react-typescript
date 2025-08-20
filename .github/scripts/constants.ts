// Constants used by workflow helper scripts
// All constants are defined in this single file to centralize configuration names.

export const ENV_GITHUB_RUN_NUMBER = "GITHUB_RUN_NUMBER";
export const ENV_GITHUB_HEAD_REF = "GITHUB_HEAD_REF";
export const ENV_GITHUB_REF_NAME = "GITHUB_REF_NAME";
export const ENV_GITHUB_REF = "GITHUB_REF";
export const ENV_FILE_GITHUB_ENV = "GITHUB_ENV";
export const ENV_FILE_GITHUB_OUTPUT = "GITHUB_OUTPUT";

export const LARK_WEBHOOK_URL_ENV = "LARK_WEBHOOK_URL";

export const MSG_TYPE_TEXT = "text";
export const MSG_TYPE_INTERACTIVE = "interactive";

// Extra envs for Lark message payload composition
export const ENV_CF_PAGES_PROJECT = "CF_PAGES_PROJECT";
export const ENV_CLOUDFLARE_API_TOKEN = "CLOUDFLARE_API_TOKEN";
export const ENV_CLOUDFLARE_ACCOUNT_ID = "CLOUDFLARE_ACCOUNT_ID";
export const ENV_JOB_STATUS = "JOB_STATUS"; // success | failure | cancelled
export const ENV_GITHUB_RUN_URL = "GITHUB_RUN_URL";
export const ENV_PR_URL = "PR_URL";
export const ENV_BRANCH_NAME = "BRANCH_NAME";

