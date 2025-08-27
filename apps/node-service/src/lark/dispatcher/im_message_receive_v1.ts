import * as Lark from '@larksuiteoapi/node-sdk';

import { LARK_TRIGGER_KEYWORDS } from '../../constants';

type MessageReceiveEvent = {
  message: { chat_id: string; content: string };
};

export const onMessageReceive = (client: Lark.Client) => {
  return async (data: unknown) => {
    const payload = data as MessageReceiveEvent;
    const { message } = payload || ({} as MessageReceiveEvent);
    const chatId = message?.chat_id;
    const content = message?.content;
    if (!chatId || !content) return;

    const parsed = (() => {
      try {
        return JSON.parse(content) as { text?: string };
      } catch {
        return {} as { text?: string };
      }
    })();
    const text = String(parsed.text || '')
      .trim()
      .toLowerCase();
    const shouldRespond = LARK_TRIGGER_KEYWORDS.some(k => text.includes(k.toLowerCase()));
    if (!shouldRespond) return;

    await client.im.v1.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: chatId,
        content: Lark.messageCard.defaultCard({ title: `收到： ${text}`, content: 'Ding!' }),
        msg_type: 'interactive',
      },
    });
  };
};
