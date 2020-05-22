import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { PostgresConfigModule } from '../src/config/database/postgres/config.module';
import { PostgresConfigService } from '../src/config/database/postgres/config.service';

import { EmailsService } from '../src/emails/emails.service';

import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/user.entity';
import { ForgotPassword } from '../src/auth/forgotpassword.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authRepository: Repository<User>;
  let forgotPasswordRepository: Repository<ForgotPassword>;

  const emailsService = {
    addWelcomeEmailToQueue: jest.fn(),
    addInvitationEmailToQueue: jest.fn(),
    addForgotPasswordEmailToQueue: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [PostgresConfigModule],
          useFactory: async (configService: PostgresConfigService) =>
            configService.typeOrmConfigTest,
          inject: [PostgresConfigService],
        }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();
    authRepository = moduleFixture.get('AuthRepository');
    forgotPasswordRepository = moduleFixture.get('ForgotPasswordRepository');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await authRepository.query(`DELETE FROM users;`);
    await forgotPasswordRepository.query(`DELETE FROM forgot_passwords;`);

    emailsService.addForgotPasswordEmailToQueue.mockRestore();
  });

  describe('POST /auth/signup', () => {
    it('should validate email input', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'test-name', password: '123456' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
        error: 'Bad Request',
      });
    });

    it('should validate password input', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '1234567' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
      });
    });

    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        email: 'email@email.teste',
        name: null,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return error when try to create a new user with an email already used', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '987654321' });

      expect(response.status).toEqual(409);
      expect(response.body).toMatchObject({
        error: 'Conflict',
        message: 'Email already exists',
        statusCode: 409,
      });
    });
  });

  describe('POST /auth/signin', () => {
    it('should return Unauthorized when try to sign in with a user that not exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });

    it('should return Unauthorized when try to sign in with wrong email/password', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.tes', password: '123456' });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });

    it('should return user data and access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        user: {
          id: expect.any(String),
          email: 'email@email.teste',
        },
        accessToken: expect.any(String),
      });
      expect(response.body.user).toHaveProperty('photo');
    });
  });

  describe('POST /auth/forgot_password', () => {
    it('should return Not Found with an invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot_password')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste' });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should create recovery token and send to email queue', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const response = await request(app.getHttpServer())
        .post('/auth/forgot_password')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste' });

      const forgotPassword = await forgotPasswordRepository.findOne({
        where: {
          email: 'email@email.teste',
        },
      });

      expect(forgotPassword).not.toBeNull();

      expect(emailsService.addForgotPasswordEmailToQueue).toBeCalledTimes(1);
      expect(response.status).toEqual(201);
    });
  });
});
