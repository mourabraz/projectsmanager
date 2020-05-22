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

  get typeTest(): any {
    return this.configService.get<string>('postgres.typeTest');
  }
  get hostTest(): string {
    return this.configService.get<string>('postgres.hostTest');
  }
  get portTest(): number {
    return Number(this.configService.get<number>('postgres.portTest'));
  }
  get usernameTest(): string {
    return this.configService.get<string>('postgres.usernameTest');
  }
  get passwordTest(): string {
    return this.configService.get<string>('postgres.passwordTest');
  }
  get nameTest(): string {
    return this.configService.get<string>('postgres.nameTest');
  }
  get typeSyncTest(): boolean {
    return Boolean(this.configService.get<boolean>('postgres.typeormSyncTest'));
  }

  get hostDevelopment(): string {
    return this.configService.get<string>('postgres.hostDevelopment');
  }
  get portDevelopment(): number {
    return Number(this.configService.get<number>('postgres.portDevelopment'));
  }
  get usernameDevelopment(): string {
    return this.configService.get<string>('postgres.usernameDevelopment');
  }
  get passwordDevelopment(): string {
    return this.configService.get<string>('postgres.passwordDevelopment');
  }
  get nameDevelopment(): string {
    return this.configService.get<string>('postgres.nameDevelopment');
  }
  get typeSyncDevelopment(): boolean {
    return Boolean(
      this.configService.get<boolean>('postgres.typeormSyncDevelopment'),
    );
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

  get typeOrmConfigTest(): TypeOrmModuleOptions {
    return {
      type: this.typeTest,
      host: this.hostTest,
      port: this.portTest,
      username: this.usernameTest,
      password: this.passwordTest,
      database: this.nameTest,
      entities: [join(__dirname, '..', '..', '..', './**/*.entity{.ts,.js}')],
      synchronize: this.typeSyncTest,
    };
  }

  get typeOrmConfigDevelopment(): TypeOrmModuleOptions {
    return {
      type: this.type,
      host: this.hostDevelopment,
      port: this.portDevelopment,
      username: this.usernameDevelopment,
      password: this.passwordDevelopment,
      database: this.nameDevelopment,
      entities: [join(__dirname, '..', '..', '..', './**/*.entity{.ts,.js}')],
      synchronize: this.typeSyncDevelopment,
    };
  }
}
