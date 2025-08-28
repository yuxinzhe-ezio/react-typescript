/**
 * Skipped Status Card Configuration
 * Create status card showing deployment was skipped due to no changes
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

interface CreateSkippedCardOptions {
  formData: FormData;
  actionUrl?: string;
}

/**
 * Create skipped status card showing no changes were detected
 */
export const createSkippedCard = ({
  formData,
  actionUrl,
}: CreateSkippedCardOptions): { card: LarkCard } => {
  const builder = new LarkCardBuilder();

  // Build content
  let content = `⏭️ **Deployment Skipped**\n\n`;
  content += `**Reason:** No changed projects detected\n`;
  content += `**Branch:** ${formData.branch_name}\n`;
  content += `**Region:** ${formData.region}\n`;
  content += `**Mode:** ${formData.trigger}\n`;

  // Set up basic card
  builder.setHeader('Auto Deploy', 'No changes detected', 'orange').addText(content, {
    text_color: 'default',
    margin: '0px 0px 8px 0px',
  });

  // Add action buttons
  const buttons: LarkButton[] = [];

  if (actionUrl) {
    buttons.push({
      tag: 'button',
      text: { tag: 'plain_text', content: 'View Actions Log' },
      type: 'default',
      url: actionUrl,
    });
  }

  if (buttons.length > 0) {
    builder.addButtons(buttons);
  }

  return builder.build();
};
