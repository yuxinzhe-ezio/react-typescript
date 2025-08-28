/**
 * Success Status Card Configuration
 * Create status card showing deployment success with action buttons
 */

import { type LarkButton, type LarkCard, LarkCardBuilder } from '../card';

export interface FormData {
  branch_name?: string;
  region?: string;
  trigger?: string;
  project_name?: string;
  version?: string;
  preview_url?: string;
  alias_url?: string;
}

export interface PRInfo {
  created?: boolean;
  number?: number;
  html_url?: string;
}

interface CreateSuccessCardOptions {
  formData: FormData;
  actionUrl?: string;
  prInfo?: PRInfo;
}

/**
 * Create success status card with action buttons and PR information
 */
export const createSuccessCard = ({
  formData,
  actionUrl,
  prInfo,
}: CreateSuccessCardOptions): { card: LarkCard } => {
  const builder = new LarkCardBuilder();

  // Build content
  let content = `✅ **Trigger deployment Success**\n\n`;

  if (formData.project_name) {
    content += `**Project:** ${formData.project_name}\n`;
  }

  if (formData.version) {
    content += `**Version:** ${formData.version}\n`;
  }

  content += `**Branch:** ${formData.branch_name}\n`;
  content += `**Region:** ${formData.region}\n`;
  content += `**Mode:** ${formData.trigger}\n`;

  if (prInfo) {
    content += `\n**PR Status:** ${prInfo.created ? 'Created' : 'Existing'} #${prInfo.number}`;
  }

  // Add deployment URLs if available
  if (formData.preview_url || formData.alias_url) {
    content += `\n\n**🔗 URLs:**\n`;
    if (formData.preview_url) {
      content += `**Preview URL:** [${formData.preview_url}](${formData.preview_url})\n`;
    }
    if (formData.alias_url) {
      content += `**Alias URL:** [${formData.alias_url}](${formData.alias_url})\n`;
    }
  }

  // Set up basic card
  builder.setHeader('Auto Deploy', 'Trigger deployment completed', 'green').addText(content, {
    text_color: 'default',
    margin: '0px 0px 8px 0px',
  });

  // Add action buttons
  const buttons: LarkButton[] = [];

  // Add deploy button (similar to confirm button but without confirmation)
  buttons.push({
    tag: 'button',
    text: { tag: 'plain_text', content: 'Deploy' },
    type: 'primary_filled',
    behaviors: [{ type: 'callback', value: { form_data: formData } }],
    name: 'deploy',
    element_id: 'deploy',
  });

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

  return builder.build();
};
