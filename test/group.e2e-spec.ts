import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { uuid } from 'uuidv4';
import { Repository } from 'typeorm';

import { EmailsService } from './../src/emails/emails.service';

import { AuthModule } from './../src/auth/auth.module';
import { UsersModule } from './../src/users/users.module';
import { User } from './../src/users/user.entity';
import { GroupsModule } from './../src/groups/groups.module';
import { Group } from './../src/groups/group.entity';

describe('Group (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
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
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
        GroupsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    groupRepository = moduleFixture.get('GroupRepository');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.query(`DELETE FROM users;`);
    await groupRepository.query(`DELETE FROM groups;`);
  });

  describe('POST /groups', () => {
    it('should throw an Anauthorized error when try to create a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

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
        .post('/groups')
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

    it('should create a new group for an authenticated user', async () => {
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
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        ownerId: user.id,
        name: 'my first group',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a new group with duplicated name for another user', async () => {
      const anotherUser = new User();
      anotherUser.email = 'user@User.com';
      anotherUser.password = '123456';
      await anotherUser.save();
      await groupRepository.insert({
        id: uuid(),
        name: 'group_name',
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
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        ownerId: user.id,
        name: 'my first group',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should not create a new group with duplicated name for the same user', async () => {
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
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      const response = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'This name "my first group" is not available',
        error: 'Bad Request',
      });
    });
  });

  describe('GET /groups', () => {
    it('should throw an Anauthorized error when try to list groups for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all groups for an authenticated user', async () => {
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
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group 1' });

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
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group 2' });

      await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group 3' });

      const response = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const totalGroups = await groupRepository.count();

      expect(response.status).toEqual(200);
      expect(response.body.length).not.toBe(totalGroups);
      expect(response.body).toMatchObject([
        {
          id: expect.any(String),
          name: 'my first group 2',
        },
        {
          id: expect.any(String),
          name: 'my first group 3',
        },
      ]);
    });
  });

  describe('UPDATE /groups/:id', () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

      const token = '';

      const response = await request(app.getHttpServer())
        .patch(`/groups/${group.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group updated' });

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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

      const response = await request(app.getHttpServer())
        .patch(`/groups/${group.id}`)
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

    it('should throw Not Found error an authenticated user not owner the group', async () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

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
        .patch(`/groups/${group.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group updated' });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it("should update name's group if authenticated user is the owner", async () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

      const response = await request(app.getHttpServer())
        .patch(`/groups/${group.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'updated name' });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: group.id,
        name: 'updated name',
      });
    });
  });

  describe('DELETE /groups/:id', () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

      const token = '';

      const response = await request(app.getHttpServer())
        .delete(`/groups/${group.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should throw Not Found error an authenticated user not owner the group', async () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

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
        .delete(`/groups/${group.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should delete group if authenticated user is the owner', async () => {
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

      const groupResponse = await request(app.getHttpServer())
        .post('/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'my first group' });

      const group = groupResponse.body;

      const response = await request(app.getHttpServer())
        .delete(`/groups/${group.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      const totalGroups = await groupRepository.count();

      expect(response.status).toEqual(200);
      expect(response.body.total).toBe(1);
      expect(totalGroups).toBe(0);
    });
  });
});
