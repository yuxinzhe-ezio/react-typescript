/**
 * Lark Card Callback Controller
 */

import * as Lark from '@larksuiteoapi/node-sdk';
import { Body, Controller, Post } from '@nestjs/common';

import {
  type DeploymentStatusPayload,
  handleDeploymentStatusCallback,
} from './dispatcher/card-callback';

@Controller('lark/callback')
export class LarkCallbackController {
  private client: Lark.Client;

  constructor() {
    // Initialize Lark client
    this.client = new Lark.Client({
      appId: process.env.LARK_APP_ID || '',
      appSecret: process.env.LARK_APP_SECRET || '',
    });
  }

  /**
   * Handle deployment status update callback
   */
  @Post('update-deployment-status')
  async handleDeploymentStatusCallback(@Body() payload: DeploymentStatusPayload) {
    const handler = handleDeploymentStatusCallback(this.client);
    return await handler(payload);
  }
}
