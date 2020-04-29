import { registerAs } from '@nestjs/config';

export default registerAs('postgres', () => ({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
  typeormSync: process.env.TYPEORM_SYNC,
}));
