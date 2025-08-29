import { Controller, Get } from '@nestjs/common';

import { DemoService } from './service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get()
  getHello() {
    return { ok: true, message: this.demo.getMessage() };
  }
}
