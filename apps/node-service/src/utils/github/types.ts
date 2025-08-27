export type GitHubPRInfo = {
  number: number;
  html_url: string;
  created?: boolean;
};

export type GitHubActionResult = {
  success: boolean;
  actionUrl?: string;
  error?: string;
  prNumber?: number;
};

export type FormData = {
  branch_name?: string;
  region?: 'global' | 'cn';
  trigger?: 'manual' | 'auto';
};
