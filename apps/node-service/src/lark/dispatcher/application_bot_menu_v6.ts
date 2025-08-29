import * as Lark from '@larksuiteoapi/node-sdk';

import { createDeployFormCard } from '../../utils/lark/cards';

// Simple rate limiting to prevent duplicate messages
const lastRequestTimes = new Map<string, number>();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds

type BotMenuEvent = {
  event_key?: string;
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
    form_data?: Record<string, string>;
  };
  form?: Record<string, string>;
  message_id?: string;
  [key: string]: unknown;
};

// Deploy card is now created by utils/lark/card.ts

export const onBotMenu = (client: Lark.Client) => {
  return async (data: unknown) => {
    const payload = data as BotMenuEvent;
    console.log('🔔 Received event:', payload.event_key || 'card_interaction');

    // Handle auto_deploy menu action
    if (payload.event_key === 'auto_deploy') {
      const openId = payload.operator?.operator_id?.open_id;
      if (!openId) return;

      // Rate limiting
      const now = Date.now();
      const lastRequestKey = `${openId}:auto_deploy`;
      const lastRequestTime = lastRequestTimes.get(lastRequestKey);
      if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW) return;

      lastRequestTimes.set(lastRequestKey, now);

      // Send deploy card using custom builder
      try {
        const cardData = createDeployFormCard();
        await client.im.v1.message.create({
          params: { receive_id_type: 'open_id' },
          data: {
            receive_id: openId,
            content: JSON.stringify(cardData.card.data),
            msg_type: 'interactive',
          },
        });
        console.log('✅ Deploy card sent');
      } catch (error) {
        console.error('❌ Failed to send card:', error);
      }
      return;
    }

    console.log(
      'ℹ️ Not an auto_deploy menu event, card interactions handled by card.action.trigger_v1'
    );
  };
};
