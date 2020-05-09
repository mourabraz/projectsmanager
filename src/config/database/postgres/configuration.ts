import { registerAs } from '@nestjs/config';

export default registerAs('postgres', () => ({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
  typeormSync: process.env.TYPEORM_SYNC,
  typeTest: process.env.DB_TYPE_TEST,
  hostTest: process.env.DB_HOST_TEST,
  portTest: process.env.DB_PORT_TEST,
  usernameTest: process.env.DB_USERNAME_TEST,
  passwordTest: process.env.DB_PASSWORD_TEST,
  nameTest: process.env.DB_NAME_TEST,
  typeormSyncTest: process.env.TYPEORM_SYNC_TEST,
}));
