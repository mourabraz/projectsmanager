import { Module } from '@nestjs/common';

import { EmailsService } from './emails.service';
import { AppConfigModule } from 'src/config/app/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
