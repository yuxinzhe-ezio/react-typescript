import * as Lark from '@larksuiteoapi/node-sdk';

import { type GitHubPRInfo, handleGitHubDeployment } from '../../utils/github';

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
    form_value?: LarkFormData; // 实际数据来源
  };
  form?: LarkFormData;
  message_id?: string;
  [key: string]: unknown;
};

// Create status card
const createStatusCard = (
  formData: LarkFormData,
  status: 'success' | 'failure',
  actionUrl?: string,
  error?: string,
  prInfo?: GitHubPRInfo
) => {
  const statusEmoji = status === 'success' ? '✅' : '❌';
  const statusText = status === 'success' ? '部署已触发' : '部署失败';

  let content = `${statusEmoji} **${statusText}**\n\n`;
  content += `**分支：** ${formData.branch_name}\n`;
  content += `**部署区域：** ${formData.region === 'global' ? 'Global' : 'China'}\n`;
  content += `**部署模式：** ${formData.trigger === 'auto' ? '自动部署' : '手动部署'}\n`;

  if (prInfo) {
    content += `\n**PR状态：** ${prInfo.created ? '新建' : '已存在'} #${prInfo.number}`;
  }

  const buttons = [];

  if (actionUrl) {
    buttons.push({
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: '查看Actions',
      },
      type: 'primary',
      url: actionUrl,
    });
  }

  if (prInfo) {
    buttons.push({
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: '查看PR',
      },
      type: 'default',
      url: prInfo.html_url,
    });
  }

  return {
    msg_type: 'interactive',
    card: {
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content,
          },
        },
        ...(buttons.length > 0
          ? [
              {
                tag: 'action',
                actions: buttons,
              },
            ]
          : []),
        ...(error
          ? [
              {
                tag: 'div',
                text: {
                  tag: 'lark_md',
                  content: `**错误信息：** ${error}`,
                },
              },
            ]
          : []),
      ],
    },
  };
};

// Extract form data directly from Lark card form
const extractFormData = (payload: CardActionEvent): LarkFormData => {
  // Extract from different possible sources
  const actionData = payload.action;
  const formValue = actionData?.form_value; // 实际数据在这里
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

export const onCardActionTrigger = (client: Lark.Client) => {
  return async (data: unknown) => {
    console.log('🎯 Card action trigger received!');
    console.log('🔍 Full data:', JSON.stringify(data, null, 2));

    const payload = data as CardActionEvent;
    console.log('📝 Event type: card.action.trigger_v1');
    console.log('📝 Action:', payload.action);

    // Extract and map form data
    const formData = extractFormData(payload);
    console.log('📊 Extracted form data:', formData);

    try {
      console.log(`📍 Deploy settings - Region: ${formData.region}, Trigger: ${formData.trigger}`);

      // 使用简化的GitHub部署处理
      const { result, prInfo } = await handleGitHubDeployment(formData);

      // 发送响应结果
      const openId = payload.operator?.operator_id?.open_id;
      if (openId) {
        const statusCard = result.success
          ? createStatusCard(formData, 'success', result.actionUrl, undefined, prInfo)
          : createStatusCard(formData, 'failure', undefined, result.error, prInfo);

        await client.im.v1.message.create({
          params: { receive_id_type: 'open_id' },
          data: {
            receive_id: openId,
            content: JSON.stringify(statusCard),
            msg_type: 'interactive',
          },
        });
        console.log('✅ Deploy result sent');
      }
    } catch (error) {
      console.error('❌ Error in deployment process:', error);

      // Send error response
      const openId = payload.operator?.operator_id?.open_id;
      if (openId) {
        try {
          const errorCard = createStatusCard(
            formData,
            'failure',
            undefined,
            `部署流程出错: ${String(error)}`
          );

          await client.im.v1.message.create({
            params: { receive_id_type: 'open_id' },
            data: {
              receive_id: openId,
              content: JSON.stringify(errorCard),
              msg_type: 'interactive',
            },
          });
        } catch (sendError) {
          console.error('❌ Failed to send error message:', sendError);
        }
      }
    }
  };
};
