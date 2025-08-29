/**
 * Card Callback Handler
 * Handle callbacks from GitHub Actions to update card status
 */

import * as Lark from '@larksuiteoapi/node-sdk';

import {
  createFailureCard,
  createSkippedCard,
  createSuccessCard,
  type FormData,
} from '../../utils/lark/cards';

/**
 * Deployment status callback payload from GitHub Actions
 * Used to update Lark card status after deployment completion
 */
export interface DeploymentStatusPayload {
  /** Lark open message ID to update the card */
  open_message_id: string;

  /** Deployment status: success (green), failure (red), or skipped (orange) */
  status: 'success' | 'failure' | 'skipped';

  /** Git branch name being deployed */
  branch_name: string;

  /** Deployment region (e.g., 'global', 'cn') */
  region: string;

  /** Deployment trigger mode (e.g., 'auto', 'manual') */
  trigger: string;

  /** Cloudflare Pages project name */
  project_name: string;

  /** Deployment version string (e.g., 'v1.2.3-alpha.4') */
  version: string;

  /** GitHub Actions workflow run URL for viewing logs */
  action_url?: string;

  /** Error message when deployment fails */
  error_message?: string;

  /** Pull request number if exists */
  pr_number?: number;

  /** Pull request URL if exists */
  pr_url?: string;

  /** Cloudflare Pages preview deployment URL */
  preview_url?: string;

  /** Cloudflare Pages production/alias URL */
  alias_url?: string;
}

/**
 * Handle deployment status update callback from GitHub Actions
 */
export const handleDeploymentStatusCallback = (client: Lark.Client) => {
  return async (payload: DeploymentStatusPayload) => {
    try {
      console.log('📬 Received deployment status callback:', payload);

      const formData: FormData = {
        branch_name: payload.branch_name,
        region: payload.region,
        trigger: payload.trigger,
      };

      // Enhanced form data with version and project info
      const enhancedFormData = {
        ...formData,
        project_name: payload.project_name,
        version: payload.version,
        preview_url: payload.preview_url,
        alias_url: payload.alias_url,
      };

      // Create appropriate status card with enhanced data
      let statusCard;
      switch (payload.status) {
        case 'success':
          statusCard = createSuccessCard({
            formData: enhancedFormData,
            actionUrl: payload.action_url,
            prInfo:
              payload.pr_number && payload.pr_url
                ? {
                    created: false,
                    number: payload.pr_number,
                    html_url: payload.pr_url,
                  }
                : undefined,
          });
          break;
        case 'skipped':
          statusCard = createSkippedCard({
            formData: enhancedFormData,
            actionUrl: payload.action_url,
          });
          break;
        case 'failure':
        default:
          statusCard = createFailureCard({
            formData: enhancedFormData,
            error: payload.error_message || 'Deployment failed',
            actionUrl: payload.action_url,
          });
          break;
      }

      // Update the card
      await client.im.v1.message.patch({
        path: { message_id: payload.open_message_id },
        data: { content: JSON.stringify(statusCard.card.data) },
      });

      console.log(
        `✅ Card updated via deployment status callback: ${payload.status.toUpperCase()} for ${payload.project_name} v${payload.version}`
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Error handling deployment status callback:', error);
      return { success: false, error: String(error) };
    }
  };
};
