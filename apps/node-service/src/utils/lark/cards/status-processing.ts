/**
 * Processing Status Card Configuration
 * Create status card showing deployment is in progress
 */

import { type LarkCard, LarkCardBuilder } from '../card';

export interface FormData {
  branch_name?: string;
  region?: string;
  trigger?: string;
}

interface CreateProcessingCardOptions {
  formData: FormData;
}

/**
 * Create processing status card with deployment information
 */
export const createProcessingCard = ({
  formData,
}: CreateProcessingCardOptions): { card: LarkCard } => {
  const builder = new LarkCardBuilder();

  // Build content
  let content = `⏳ **Processing...**\n\n`;
  content += `**Branch:** ${formData.branch_name}\n`;
  content += `**Region:** ${formData.region}\n`;
  content += `**Mode:** ${formData.trigger}\n`;

  return builder
    .setHeader('Auto Deploy', 'Processing...', 'blue')
    .addText(content, {
      text_color: 'default',
      margin: '0px 0px 8px 0px',
    })
    .build();
};
