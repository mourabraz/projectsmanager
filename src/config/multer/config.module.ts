import { Module } from '@nestjs/common';

import { MulterConfigService } from './config.service';

@Module({
  providers: [MulterConfigService],
  exports: [MulterConfigService],
})
export class MulterConfigModule {}
