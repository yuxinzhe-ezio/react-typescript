// Export all types
export type { FormData, GitHubActionResult, GitHubPRInfo } from './types';

// Export constants
export {
  GITHUB_API_BASE_URL,
  GITHUB_API_HEADERS,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_TOKEN,
} from './constants';

// Export individual functions
export { triggerGitHubAction } from './actions';
export { checkPullRequest, createPullRequest } from './pr';

// Import dependencies for main deployment function
import { triggerGitHubAction } from './actions';
import { checkPullRequest, createPullRequest } from './pr';
import type { FormData, GitHubActionResult, GitHubPRInfo } from './types';

/**
 * 完整的GitHub部署流程：检查/创建PR + 触发Actions
 */
export const handleGitHubDeployment = async (
  formData: FormData,
  openMessageId?: string
): Promise<{ result: GitHubActionResult; prInfo?: GitHubPRInfo }> => {
  console.log('🏗️ Starting GitHub deployment process...');

  let prInfo: GitHubPRInfo | undefined;

  try {
    // Step 1: Check if PR exists
    const existingPR = await checkPullRequest(formData.branch_name!);

    if (existingPR) {
      console.log('📋 Using existing PR:', existingPR.number, existingPR.html_url);
      prInfo = {
        number: existingPR.number,
        html_url: existingPR.html_url,
        created: false,
      };
    } else {
      // Step 2: Create new PR
      console.log(`🆕 Creating new PR for branch: ${formData.branch_name}`);
      const newPR = await createPullRequest(formData.branch_name!);

      if (newPR) {
        console.log('✅ Successfully created PR:', newPR.number, newPR.html_url);
        prInfo = {
          number: newPR.number,
          html_url: newPR.html_url,
          created: true,
        };
      } else {
        console.log('⚠️ Failed to create PR, proceeding without PR info...');
      }
    }

    // Step 3: Trigger GitHub Actions
    const result = await triggerGitHubAction(formData, openMessageId, prInfo?.number);
    console.log('🎯 GitHub deployment result:', result.success ? 'SUCCESS' : 'FAILED');

    return { result, prInfo };
  } catch (error) {
    console.error('❌ GitHub deployment process failed:', error);
    return {
      result: {
        success: false,
        error: `Deployment process failed: ${String(error)}`,
      },
    };
  }
};
