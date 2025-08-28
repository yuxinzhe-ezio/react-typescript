/**
 * Failure Status Card Configuration
 * Create status card showing deployment failure with error details
 */

import { type LarkButton, type LarkCard, LarkCardBuilder } from '../card';

export interface FormData {
  branch_name?: string;
  region?: string;
  trigger?: string;
}

export interface PRInfo {
  created?: boolean;
  number?: number;
  html_url?: string;
}

/**
 * Create failure status card with error information and action buttons
 */
export const createFailureCard = (
  formData: FormData,
  error?: string,
  actionUrl?: string,
  prInfo?: PRInfo
): { card: LarkCard } => {
  const builder = new LarkCardBuilder();

  // Build basic content
  let content = `❌ **Deployment Failed**\n\n`;
  content += `**Branch:** ${formData.branch_name}\n`;
  content += `**Region:** ${formData.region === 'global' ? 'Global' : 'China'}\n`;
  content += `**Mode:** ${formData.trigger === 'auto' ? 'Auto Deploy' : 'Manual Deploy'}\n`;

  if (prInfo) {
    content += `\n**PR Status:** ${prInfo.created ? 'Created' : 'Existing'} #${prInfo.number}`;
  }

  // Set up basic card
  builder.setHeader('Auto Deploy Status', 'Deployment failed', 'red').addText(content, {
    text_color: 'default',
    margin: '0px 0px 8px 0px',
  });

  // Add action buttons
  const buttons: LarkButton[] = [];

  if (actionUrl) {
    buttons.push({
      tag: 'button',
      text: { tag: 'plain_text', content: 'View Actions' },
      type: 'primary',
      url: actionUrl,
    });
  }

  if (prInfo?.html_url) {
    buttons.push({
      tag: 'button',
      text: { tag: 'plain_text', content: 'View PR' },
      type: 'default',
      url: prInfo.html_url,
    });
  }

  if (buttons.length > 0) {
    builder.addButtons(buttons);
  }

  // Add error information
  if (error) {
    builder.addText(`**Error:** ${error}`, {
      text_color: 'red',
      margin: '8px 0px 0px 0px',
    });
  }

  return builder.build();
};
