import { Module } from '@nestjs/common';

import { DemoModule } from './demo/module';
import { LarkModule } from './lark/module';

@Module({
  imports: [DemoModule, LarkModule],
})
export class AppModule {}
