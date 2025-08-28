import * as Lark from '@larksuiteoapi/node-sdk';

import { handleGitHubDeployment } from '../../utils/github';
import { createFailureCard, createProcessingCard } from '../../utils/lark/cards';

// Form data structure from Lark card
type LarkFormData = {
  branch_name?: string;
  trigger?: 'manual' | 'auto'; // manual or auto
  region?: 'global' | 'cn'; // global or cn
};

type CardActionEvent = {
  operator?: {
    operator_id?: {
      open_id?: string;
      union_id?: string;
      user_id?: string;
    };
  };
  action?: {
    name?: string;
    value?: string;
    form_data?: LarkFormData;
    form_value?: LarkFormData; // Actual data source
  };
  form?: LarkFormData;
  context?: {
    open_message_id?: string;
    open_chat_id?: string;
  };
  message_id?: string;
  [key: string]: unknown;
};

// Status card creation is now handled by utils/lark/card.ts

// Extract form data directly from Lark card form
const extractFormData = (payload: CardActionEvent): LarkFormData => {
  // Extract from different possible sources
  const actionData = payload.action;
  const formValue = actionData?.form_value; // Actual data is here
  const formData = actionData?.form_data || payload.form;

  console.log('🔍 Action data:', actionData);
  console.log('🔍 Form value:', formValue);
  console.log('🔍 Form data:', formData);

  // Extract with priority: form_value > form_data > form > defaults
  const branch_name = formValue?.branch_name || formData?.branch_name || 'dev';
  const region = formValue?.region || formData?.region || 'global'; // global | cn
  const trigger = formValue?.trigger || formData?.trigger || 'auto'; // manual | auto

  console.log('📊 Parsed form data:', {
    branch_name,
    region: region === 'global' ? 'Global' : 'China',
    trigger: trigger === 'auto' ? 'Auto Deploy' : 'Manual Deploy',
  });

  return { branch_name, region, trigger };
};

export const onCardActionTrigger = (_client: Lark.Client) => {
  return async (data: unknown) => {
    console.log('🎯 Card action trigger received!');
    console.log('🔍 Full data:', JSON.stringify(data, null, 2));

    const payload = data as CardActionEvent;
    console.log('📝 Event type: card.action.trigger');
    console.log('📝 Action:', payload.action);

    // Extract and map form data
    const formData = extractFormData(payload);
    console.log('📊 Extracted form data:', formData);

    // Get openMessageId for card update (prioritize context)
    const openMessageId = payload.context?.open_message_id || payload.message_id;
    console.log('🆔 Open Message ID:', openMessageId);

    // According to official docs: create processing status card for sync return
    const processingCard = createProcessingCard({ formData });
    console.log('✅ Preparing processing status for immediate response');

    // Real GitHub deployment handling
    setImmediate(async () => {
      try {
        console.log(
          `📍 Deploy settings - Region: ${formData.region}, Trigger: ${formData.trigger}`
        );

        // Use GitHub deployment handling with openMessageId for callback
        const { result, prInfo } = await handleGitHubDeployment(formData, openMessageId);

        // Update card based on GitHub Actions trigger result
        if (openMessageId) {
          const statusCard = result.success
            ? createProcessingCard({
                formData,
                prInfo,
              })
            : createFailureCard({
                formData,
                error: result.error || 'Failed to trigger GitHub Actions',
                actionUrl: result.actionUrl,
              });
          console.log(
            '📔 Updating card after trigger:',
            result.success ? 'PROCESSING' : 'TRIGGER_FAILED'
          );
          await _client.im.v1.message.patch({
            path: {
              message_id: openMessageId,
            },
            data: {
              content: JSON.stringify(statusCard.card.data),
            },
          });
          console.log(
            `✅ Card updated with trigger result: ${result.success ? 'PROCESSING' : 'TRIGGER_FAILED'}`
          );
        } else {
          console.error('❌ No openMessageId found, cannot update card');
        }
      } catch (error) {
        console.error('❌ Error in GitHub Actions trigger process:', error);

        // Update card to error status
        if (openMessageId) {
          try {
            const errorCard = createFailureCard({
              formData,
              error: `Failed to trigger GitHub Actions: ${String(error)}`,
              actionUrl: undefined,
            });

            await _client.im.v1.message.patch({
              path: {
                message_id: openMessageId,
              },
              data: {
                content: JSON.stringify(errorCard.card.data),
              },
            });
            console.log('✅ Card updated with error status');
          } catch (updateError) {
            console.error('❌ Failed to update card with error:', updateError);
          }
        } else {
          console.error('❌ No openMessageId found, cannot update card with error');
        }
      }
    });

    // According to official docs: sync return processing status card
    // Ensure return v2 format card (includes config)
    console.log('📔 Returning processing card:', processingCard);
    return processingCard;
  };
};
