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

describe('Project (e2e)', () => {
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

  describe('POST /groups/:groupId/projects', () => {
    it('should throw an Anauthorized error when try to create a project not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should validate title', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['title should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should create a project on a group owned by the authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        groupId: groupsOwnedByUser1[0].id,
        ownerId: user1.id,
        title: 'my first project',
        description: 'description of project 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a project on a group where the authenticated user is a participant', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser2[1].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        groupId: groupsOwnedByUser2[1].id,
        ownerId: user1.id,
        title: 'my first project',
        description: 'description of project 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should throw Not Found Error when create a project on a group owned by another user where the authenticated user is not participating', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser2[0].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should throw Not Found Error when create a project on a group that does not exists', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${uuid()}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });
  });

  describe('GET /groups/:groupId/projects', () => {
    it('should throw an Anauthorized error when try to list projects for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupsOwnedByUser1[0]}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all projects associated to authenticated user', async () => {
      const token = user1Token;

      await projectsService.createProjectForUser(
        {
          title: 'ttile1',
          description: '',
          groupId: groupsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );
      await projectsService.createProjectForUser(
        {
          title: 'ttile2',
          description: '',
          groupId: groupsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      await projectsService.createProjectForUser(
        {
          title: 'ttile2',
          description: '',
          groupId: groupsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user1,
      );
      await projectsService.createProjectForUser(
        {
          title: 'ttile3',
          description: '',
          groupId: groupsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user2,
      );
      await projectsService.createProjectForUser(
        {
          title: 'ttile4',
          description: '',
          groupId: groupsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user2,
      );

      const response1 = await request(app.getHttpServer())
        .get(`/groups/${groupsOwnedByUser1[0].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const response2 = await request(app.getHttpServer())
        .get(`/groups/${groupsOwnedByUser2[1].id}/projects`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response1.status).toEqual(200);
      expect(response1.body.length).toBe(2);

      expect(response2.status).toEqual(200);
      expect(response2.body.length).toBe(3);
    });
  });

  describe('UPDATE /projects/:id', () => {
    it('should throw Not Found when update a project owned by another user', async () => {
      const token = user1Token;

      const project = await projectsService.createProjectForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          groupId: groupsOwnedByUser2[1].id,
        },
        user2,
      );
      const response = await request(app.getHttpServer())
        .put(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my updated project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should update a project owned by the authenticated user', async () => {
      const token = user1Token;

      const project = await projectsService.createProjectForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          groupId: groupsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .put(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my updated project',
          description: 'description of project 1',
        });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        groupId: groupsOwnedByUser1[0].id,
        ownerId: user1.id,
        title: 'my updated project',
        description: 'description of project 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should throw Not Found when delete a project owned by another user', async () => {
      const token = user1Token;

      const project = await projectsService.createProjectForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          groupId: groupsOwnedByUser2[1].id,
        },
        user2,
      );
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

    it('should delete a project owned by the authenticated user', async () => {
      const token = user1Token;

      const project = await projectsService.createProjectForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          groupId: groupsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.total).toBe(1);
    });
  });
});
