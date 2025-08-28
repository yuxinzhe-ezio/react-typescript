/**
 * Deploy Form Card Configuration
 * Create interactive form card for deployment configuration
 */

import { type LarkButton, type LarkCard, LarkCardBuilder } from '../card';

/**
 * Create deployment form card with branch input, region select, and mode select
 */
export const createDeployFormCard = (): { card: LarkCard } => {
  const builder = new LarkCardBuilder();

  // Create form elements
  const branchInput = builder.addInput('branch_name', 'branchName', 'branch name', {
    label: 'Branch Name',
    label_position: 'left',
  });

  const regionSelect = builder.addSelect(
    'region',
    'region',
    'Region',
    [
      { text: 'Global', value: 'global', icon: 'right_outlined' },
      { text: 'CN', value: 'cn', icon: 'right_outlined' },
    ],
    { required: true }
  );

  const modeSelect = builder.addSelect(
    'mode',
    'mode',
    'mode',
    [
      { text: 'Manual', value: 'manual', icon: 'right_outlined' },
      { text: 'Auto', value: 'auto', icon: 'right_outlined' },
    ],
    { required: true }
  );

  const confirmButton: LarkButton = {
    tag: 'button',
    text: { tag: 'plain_text', content: 'Confirm' },
    type: 'primary_filled',
    confirm: {
      title: { tag: 'plain_text', content: 'Confirm' },
      text: { tag: 'plain_text', content: 'Confirm Auto Deploy Config' },
    },
    behaviors: [{ type: 'callback', value: {} }],
    form_action_type: 'submit',
    name: 'confirm',
    element_id: 'confirm',
  };

  return builder
    .setHeader('Auto Deploy', 'auto build and deploy to cloudflare', 'blue')
    .addForm('Form_deploy', [
      branchInput,
      {
        tag: 'div',
        text: {
          tag: 'plain_text',
          content: 'Region & Mode',
          text_size: 'normal_v2',
          text_align: 'left',
          text_color: 'default',
        },
        margin: '0px 0px 0px 0px',
      },
      regionSelect,
      modeSelect,
      {
        tag: 'column_set',
        horizontal_align: 'left',
        columns: [
          {
            tag: 'column',
            width: 'auto',
            elements: [confirmButton],
            vertical_spacing: '8px',
            horizontal_align: 'left',
            vertical_align: 'top',
          },
        ],
      },
    ])
    .build();
};
