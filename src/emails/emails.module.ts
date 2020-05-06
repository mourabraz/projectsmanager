import { Module } from '@nestjs/common';

import { EmailsService } from './emails.service';
import { AppConfigService } from 'src/config/app/config.service';

@Module({
  imports: [AppConfigService],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
