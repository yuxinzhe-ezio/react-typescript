import { GITHUB_API_BASE_URL, GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } from '../../constants';

export { GITHUB_API_BASE_URL, GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN };

export const GITHUB_API_HEADERS = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
};
