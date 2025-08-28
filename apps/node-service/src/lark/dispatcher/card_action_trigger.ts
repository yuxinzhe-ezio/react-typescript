import * as Lark from '@larksuiteoapi/node-sdk';

import { createFailureCard, createProcessingCard, createSuccessCard } from '../../utils/lark/cards';
// import { type GitHubPRInfo } from '../../utils/github';
// import { handleGitHubDeployment } from '../../utils/github';

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

    // Get message_id for card update (prioritize context)
    const messageId = payload.context?.open_message_id || payload.message_id;
    console.log('🆔 Message ID:', messageId);

    // According to official docs: create processing status card for sync return
    const processingCard = createProcessingCard(formData);
    console.log('✅ Preparing processing status for immediate response');

    // Simple setTimeout mock for testing
    setTimeout(async () => {
      try {
        // Random success/failure
        const isSuccess = Math.random() > 0.3; // 70% success rate

        console.log(`🎲 Mock result: ${isSuccess ? 'SUCCESS' : 'FAILURE'}`);

        if (messageId) {
          const statusCard = isSuccess
            ? createSuccessCard(formData)
            : createFailureCard(formData, 'Mock deployment failed');

          await _client.im.v1.message.patch({
            path: { message_id: messageId },
            data: { content: JSON.stringify(statusCard.card.data) },
          });
          console.log(`✅ Card updated with ${isSuccess ? 'SUCCESS' : 'FAILURE'} result`);
        }
      } catch (error) {
        console.error('❌ Error in mock process:', error);
      }
    }, 1000);

    // Original GitHub operations handling (commented for testing)
    //     setImmediate(async () => {
    //       try {
    //         console.log(
    //           `📍 Deploy settings - Region: ${formData.region}, Trigger: ${formData.trigger}`
    //         );
    //
    //         // Use simplified GitHub deployment handling
    //         const { result, prInfo } = await handleGitHubDeployment(formData);
    //
    //         // Async update card to final status
    //         if (messageId) {
    //           const statusCard = result.success
    //             ? createStatusCard(formData, 'success', result.actionUrl, undefined, prInfo)
    //             : createStatusCard(formData, 'failure', undefined, result.error, prInfo);
    //
    //           await _client.im.v1.message.patch({
    //             path: {
    //               message_id: messageId,
    //             },
    //             data: {
    //               content: JSON.stringify(statusCard),
    //             },
    //           });
    //           console.log('✅ Card updated with deploy result');
    //         } else {
    //           console.error('❌ No message_id found, cannot update card');
    //         }
    //       } catch (error) {
    //         console.error('❌ Error in deployment process:', error);
    //
    //         // Update card to error status
    //         if (messageId) {
    //           try {
    //             const errorCard = createStatusCard(
    //               formData,
    //               'failure',
    //               undefined,
    //               `Deployment process failed: ${String(error)}`
    //             );
    //
    //             await _client.im.v1.message.patch({
    //               path: {
    //                 message_id: messageId,
    //               },
    //               data: {
    //                 content: JSON.stringify(errorCard),
    //               },
    //             });
    //             console.log('✅ Card updated with error status');
    //           } catch (updateError) {
    //             console.error('❌ Failed to update card with error:', updateError);
    //           }
    //         } else {
    //           console.error('❌ No message_id found, cannot update card with error');
    //         }
    //       }
    //     });

    // According to official docs: sync return processing status card
    // Ensure return v2 format card (includes config)
    console.log('special log 📔📔📔📔📔📔', processingCard);
    return processingCard;
  };
};
