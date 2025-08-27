import { Module } from '@nestjs/common';

import { DemoModule } from './demo/module';

@Module({
  imports: [DemoModule],
})
export class AppModule {}
