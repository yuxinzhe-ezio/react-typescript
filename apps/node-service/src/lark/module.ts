import { Module } from '@nestjs/common';

import { LarkCallbackController } from './controller';

@Module({
  controllers: [LarkCallbackController],
})
export class LarkModule {}
