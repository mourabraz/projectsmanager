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
import { GroupsService } from './../src/groups/groups.service';
import { ProjectsModule } from './../src/projects/projects.module';
import { Project } from './../src/projects/project.entity';
import { AuthService } from './../src/auth/auth.service';
import { UsersGroupsService } from './../src/users-groups/users-groups.service';
import { UsersGroupsModule } from './../src/users-groups/users-groups.module';
import { ProjectsService } from './../src/projects/projects.service';

describe('User (e2e)', () => {
  let app: INestApplication;

  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let projectRepository: Repository<Project>;

  let authService: AuthService;
  let groupsService: GroupsService;
  let usersGroupsService: UsersGroupsService;
  let projectsService: ProjectsService;

  let user1: User;
  let user2: User;
  let user1Token: string;

  const groupsOwnedByUser1: Group[] = [];
  const groupsOwnedByUser2: Group[] = [];

  const emailsService = { addWelcomeEmailToQueue: () => ({}) };

  const populateInitialData = async () => {
    user1 = await authService.signUp({
      email: 'user1@teste.teste',
      password: '12345678',
    });
    user2 = await authService.signUp({
      email: 'user2@teste.teste',
      password: '12345678',
    });

    user1Token = (
      await authService.signIn({
        email: user1.email,
        password: '12345678',
      })
    ).accessToken;

    groupsOwnedByUser1.push(
      await groupsService.createGroup({ name: 'grupo 1.1' }, user1),
    );
    groupsOwnedByUser1.push(
      await groupsService.createGroup({ name: 'grupo 1.2' }, user1),
    );
    groupsOwnedByUser1.push(
      await groupsService.createGroup({ name: 'grupo 1.3' }, user1),
    );
    groupsOwnedByUser2.push(
      await groupsService.createGroup({ name: 'grupo 2.1' }, user2),
    );
    groupsOwnedByUser2.push(
      await groupsService.createGroup({ name: 'grupo 2.2' }, user2),
    );

    await usersGroupsService.addParticipantToGroup(
      user1,
      groupsOwnedByUser2[1].id,
    );
  };

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
        ProjectsModule,
        UsersGroupsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();

    userRepository = moduleFixture.get('UserRepository');
    groupRepository = moduleFixture.get('GroupRepository');
    projectRepository = moduleFixture.get('ProjectRepository');

    authService = moduleFixture.get(AuthService);
    groupsService = moduleFixture.get(GroupsService);
    usersGroupsService = moduleFixture.get(UsersGroupsService);
    projectsService = moduleFixture.get(ProjectsService);

    await app.init();

    await populateInitialData();
  });

  afterAll(async () => {
    await groupRepository.query(`DELETE FROM groups;`);
    await userRepository.query(`DELETE FROM users;`);

    await app.close();
  });

  afterEach(async () => {
    await projectRepository.query(`DELETE FROM projects;`);
  });

  describe('UPDATE /users', () => {
    it('should throw Unauthorized for unauthenticated user', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My name is',
        });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should validate name input', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['name should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should validate email input', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: '',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      });
    });

    it('should validate password input', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: '',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
      });
    });

    it('should update name of authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My name is',
        });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: user1.id,
        name: 'My name is',
        email: user1.email,
        createdAt: user1.createdAt.toISOString(),
        updatedAt: expect.any(String),
      });

      user1.name = 'My name is';
      user1Token = (
        await authService.signIn({
          email: user1.email,
          password: '12345678',
        })
      ).accessToken;
    });

    it('should update email of authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'teste@teste.com',
        });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: user1.id,
        name: user1.name,
        email: 'teste@teste.com',
        createdAt: user1.createdAt.toISOString(),
        updatedAt: expect.any(String),
      });

      user1.email = 'teste@teste.com';
      user1Token = (
        await authService.signIn({
          email: user1.email,
          password: '12345678',
        })
      ).accessToken;
    });

    it('should update password of authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: '987654321',
        });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: user1.id,
        name: user1.name,
        email: user1.email,
        createdAt: user1.createdAt.toISOString(),
        updatedAt: expect.any(String),
      });

      user1.password = '987654321';
      user1Token = (
        await authService.signIn({
          email: user1.email,
          password: user1.password,
        })
      ).accessToken;
    });

    it('should invalidate token after any update', async () => {
      const token = user1Token;

      await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Now my name is',
          email: 'user1@teste.teste',
          password: '12345678',
        });

      const response = await request(app.getHttpServer())
        .put('/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My name is',
        });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });

      user1.name = 'Now my name is';
      user1.email = 'user1@teste.teste';
      user1.password = '12345678';
      user1Token = (
        await authService.signIn({
          email: user1.email,
          password: user1.password,
        })
      ).accessToken;
    });
  });
});
