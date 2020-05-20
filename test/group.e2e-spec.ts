import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { uuid } from 'uuidv4';
import { Repository } from 'typeorm';

import { PostgresConfigModule } from '../src/config/database/postgres/config.module';
import { PostgresConfigService } from '../src/config/database/postgres/config.service';

import { EmailsService } from './../src/emails/emails.service';

import { AuthModule } from './../src/auth/auth.module';
import { UsersModule } from './../src/users/users.module';
import { User } from './../src/users/user.entity';
import { ProjectsModule } from './../src/projects/projects.module';
import { Project } from './../src/projects/project.entity';

describe('Project (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  const emailsService = { addWelcomeEmailToQueue: () => ({}) };

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
        ProjectsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    projectRepository = moduleFixture.get('ProjectRepository');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.query(`DELETE FROM users;`);
    await projectRepository.query(`DELETE FROM projects;`);
  });

  describe('POST /projects', () => {
    it('should throw an Anauthorized error when try to create a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should validate name input', async () => {
      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['name should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should create a new project for an authenticated user', async () => {
      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        ownerId: user.id,
        name: 'my first project',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a new project with duplicated name for another user', async () => {
      const anotherUser = new User();
      anotherUser.email = 'user@User.com';
      anotherUser.password = '123456';
      await userRepository.save(anotherUser);
      await projectRepository.insert({
        id: uuid(),
        name: 'project_name',
        ownerId: anotherUser.id,
      });

      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        ownerId: user.id,
        name: 'my first project',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should not create a new project with duplicated name for the same user', async () => {
      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'This name "my first project" is not available',
        error: 'Bad Request',
      });
    });
  });

  describe('GET /projects', () => {
    it('should throw an Anauthorized error when try to list projects for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all projects for an authenticated user', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project 1' });

      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project 2' });

      await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project 3' });

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const totalProjects = await projectRepository.count();

      expect(response.status).toEqual(200);
      expect(response.body.length).not.toBe(totalProjects);
      expect(response.body).toMatchObject([
        {
          id: expect.any(String),
          name: 'my first project 2',
        },
        {
          id: expect.any(String),
          name: 'my first project 3',
        },
      ]);
    });
  });

  describe('UPDATE /projects/:id', () => {
    it('should throw Unauthorized error for an authenticated user', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const token = '';

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project updated' });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should validate name input', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: '' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['name should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should throw Not Found error an authenticated user not owner the project', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project updated' });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it("should update name's project if authenticated user is the owner", async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const user = userResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'updated name' });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: project.id,
        name: 'updated name',
      });
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should throw Unauthorized error for a user not authenticated', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const token = '';

      const response = await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should throw Not Found error an authenticated user not owner the project', async () => {
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const anotherUser = anotherUserResponse.body;

      const anotherSingInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: anotherUser.email, password: '12345678' });

      const anotherToken = anotherSingInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const createUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'email@email.teste', password: '12345678' });

      const user = createUserResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should delete project if authenticated user is the owner', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Accept', 'application/json')
        .send({ email: 'user@another.teste', password: '12345678' });

      const user = userResponse.body;

      const singInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .set('Accept', 'application/json')
        .send({ email: user.email, password: '12345678' });

      const token = singInResponse.body.accessToken;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first project' });

      const project = projectResponse.body;

      const response = await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      const totalProjects = await projectRepository.count();

      expect(response.status).toEqual(200);
      expect(response.body.total).toBe(1);
      expect(totalProjects).toBe(0);
    });
  });
});
