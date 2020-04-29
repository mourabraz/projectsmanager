import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class PostgresConfigService {
  constructor(private configService: ConfigService) {}

  get type(): any {
    return this.configService.get<string>('postgres.type');
  }
  get host(): string {
    return this.configService.get<string>('postgres.host');
  }
  get port(): number {
    return Number(this.configService.get<number>('postgres.port'));
  }
  get username(): string {
    return this.configService.get<string>('postgres.username');
  }
  get password(): string {
    return this.configService.get<string>('postgres.password');
  }
  get name(): string {
    return this.configService.get<string>('postgres.name');
  }
  get typeSync(): boolean {
    return Boolean(this.configService.get<boolean>('postgres.typeormSync'));
  }

  get typeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: this.type,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.name,
      entities: [join(__dirname, '..', '..', '..', './**/*.entity{.ts,.js}')],
      synchronize: this.typeSync,
    };
  }
}
