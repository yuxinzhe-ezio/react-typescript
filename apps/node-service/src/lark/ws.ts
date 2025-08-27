import * as Lark from '@larksuiteoapi/node-sdk';

import { LARK_BASE_CONFIG } from '../constants';
import { createEventDispatcher } from './dispatcher';

const client = new Lark.Client(LARK_BASE_CONFIG);
const wsClient = new Lark.WSClient({ ...LARK_BASE_CONFIG, loggerLevel: Lark.LoggerLevel.debug });

wsClient.start({
  eventDispatcher: createEventDispatcher(client),
});
