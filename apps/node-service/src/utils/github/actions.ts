import { GITHUB_WORKFLOW_ID } from '../../constants';
import { GITHUB_API_BASE_URL, GITHUB_API_HEADERS, GITHUB_OWNER, GITHUB_REPO } from './constants';
import type { FormData, GitHubActionResult } from './types';

/**
 * 触发GitHub Actions工作流
 */
export const triggerGitHubAction = async (
  formData: FormData,
  prNumber?: number
): Promise<GitHubActionResult> => {
  try {
    console.log(`🚀 Triggering GitHub Actions for branch: ${formData.branch_name}`);
    console.log(`📋 Parameters: region=${formData.region}, trigger=${formData.trigger}`);

    // 检查可用的workflows
    const workflowResponse = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`,
      {
        headers: {
          Authorization: GITHUB_API_HEADERS.Authorization,
          Accept: GITHUB_API_HEADERS.Accept,
        },
      }
    );

    if (workflowResponse.ok) {
      const workflows = await workflowResponse.json();
      console.log(
        '📋 Available workflows:',
        workflows.workflows?.map((w: { name: string }) => w.name) || []
      );
    }

    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`,
      {
        method: 'POST',
        headers: GITHUB_API_HEADERS,
        body: JSON.stringify({
          ref: formData.branch_name || 'master',
          inputs: {
            // 简化inputs，只发送基本参数
            region: formData.region || 'global',
            mode: formData.trigger || 'manual',
          },
        }),
      }
    );

    if (response.ok) {
      console.log('✅ GitHub Actions triggered successfully');
      return {
        success: true,
        actionUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
        prNumber,
      };
    } else {
      const errorText = await response.text();
      console.error('❌ GitHub Actions error:', response.status, errorText);

      // 如果是workflow不存在，提供更好的错误信息
      if (response.status === 404) {
        const workflows = await workflowResponse.json();
        return {
          success: false,
          error: `Workflow '${GITHUB_WORKFLOW_ID}' not found. Available workflows: ${workflows.workflows?.map((w: { name: string }) => w.name).join(', ') || 'None'}`,
        };
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    console.error('❌ Error triggering GitHub Actions:', error);
    return {
      success: false,
      error: String(error),
    };
  }
};
