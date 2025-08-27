import { Module } from '@nestjs/common';

import { DemoController } from './controller';
import { DemoService } from './service';

@Module({
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
