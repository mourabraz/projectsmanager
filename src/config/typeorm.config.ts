import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'projectsmanager',
  entities: [join(__dirname, '..', './**/*.entity{.ts,.js}')],
  synchronize: true,
};
