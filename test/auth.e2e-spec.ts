import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { AuthModule } from './../src/auth/auth.module';
import { UsersModule } from './../src/users/users.module';
import { User } from './../src/users/user.entity';

import { EmailsService } from './../src/emails/emails.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<User>;
  const emailsService = { addWelcomeEmailToQueue: () => ({}) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'docker',
          database: 'projectmanagerapp_tests',
          entities: ['./**/*.entity.ts'],
          //entities: [`./../src/**/*.entity{.ts,.js}`],
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get('AuthRepository');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await repository.query(`DELETE FROM users;`);
  });

  describe('POST /signup', () => {
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
        photo: null,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return error when try to creat a new user with an email already used', async () => {
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

  describe('POST /signin', () => {
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

    it('should return token', async () => {
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
        accessToken: expect.any(String),
      });
    });
  });
});
