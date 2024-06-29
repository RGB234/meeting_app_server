import { Injectable, Req } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  echoReqBody(@Req() request: Request): any {
    return request.body;
  }
}
