import { Module } from '@nestjs/common';

import { FiilesService } from './fiiles.service';

@Module({
  providers: [FiilesService],
})
export class FiilesModule {}
