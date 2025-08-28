import { GITHUB_API_BASE_URL, GITHUB_API_HEADERS, GITHUB_OWNER, GITHUB_REPO } from './constants';

/**
 * 检查指定分支是否存在PR
 */
export const checkPullRequest = async (branchName: string): Promise<any | null> => {
  try {
    console.log(`🔍 Checking PRs for branch: ${branchName}`);

    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?head=${branchName}&state=open&base=master`,
      {
        headers: {
          Authorization: GITHUB_API_HEADERS.Authorization,
          Accept: GITHUB_API_HEADERS.Accept,
        },
      }
    );

    if (response.ok) {
      const pulls = await response.json();
      console.log(`✅ Found ${pulls.length} open PRs for branch ${branchName} (base: master)`);
      return pulls.length > 0 ? pulls[0] : null;
    } else {
      console.error('❌ Failed to check PR:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking PR:', error);
    return null;
  }
};

/**
 * 创建新的Pull Request
 */
export const createPullRequest = async (branchName: string): Promise<any | null> => {
  try {
    console.log(`🔍 Creating PR: ${branchName} -> master`);
    console.log(`📋 Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);

    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`,
      {
        method: 'POST',
        headers: GITHUB_API_HEADERS,
        body: JSON.stringify({
          title: `Auto Deploy: ${branchName}`,
          head: branchName, // Source branch (same repo, no need for owner prefix)
          base: 'master', // Use master branch
          body: `Automated deployment PR created from Lark Bot\n\n**Branch:** ${branchName}\n**Triggered by:** Lark Bot`,
          draft: false,
        }),
      }
    );

    if (response.ok) {
      const pr = await response.json();
      console.log('✅ Created new PR:', pr.html_url);
      return pr;
    } else {
      const errorResponse = await response.json();
      console.error('❌ Failed to create PR:', response.status);
      console.error('❌ Error details:', JSON.stringify(errorResponse, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating PR:', error);
    return null;
  }
};
