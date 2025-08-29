import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
  getMessage = () => 'Hello from demo';
}
