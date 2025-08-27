import * as Lark from '@larksuiteoapi/node-sdk';

import { onBotMenu } from './application_bot_menu_v6';
import { onMessageReceive } from './im_message_receive_v1';

export const createEventDispatcher = (client: Lark.Client) => {
  return new Lark.EventDispatcher({}).register({
    'im.message.receive_v1': onMessageReceive(client),
    'application.bot.menu_v6': onBotMenu(),
  });
};
