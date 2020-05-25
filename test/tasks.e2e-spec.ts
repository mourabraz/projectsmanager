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
import { ProjectsService } from './../src/projects/projects.service';
import { TasksModule } from './../src/tasks/tasks.module';
import { Task } from './../src/tasks/task.entity';
import { AuthService } from './../src/auth/auth.service';
import { UsersProjectsService } from './../src/users-projects/users-projects.service';
import { UsersProjectsModule } from './../src/users-projects/users-projects.module';
import { TasksService } from './../src/tasks/tasks.service';

describe('Task (e2e)', () => {
  let app: INestApplication;

  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;

  let authService: AuthService;
  let projectsService: ProjectsService;
  let usersProjectsService: UsersProjectsService;
  let tasksService: TasksService;

  let user1: User;
  let user2: User;
  let user1Token: string;

  const projectsOwnedByUser1: Project[] = [];
  const projectsOwnedByUser2: Project[] = [];

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

    projectsOwnedByUser1.push(
      await projectsService.createProject({ name: 'grupo 1.1' }, user1),
    );
    projectsOwnedByUser1.push(
      await projectsService.createProject({ name: 'grupo 1.2' }, user1),
    );
    projectsOwnedByUser1.push(
      await projectsService.createProject({ name: 'grupo 1.3' }, user1),
    );
    projectsOwnedByUser2.push(
      await projectsService.createProject({ name: 'grupo 2.1' }, user2),
    );
    projectsOwnedByUser2.push(
      await projectsService.createProject({ name: 'grupo 2.2' }, user2),
    );

    await usersProjectsService.addParticipantToProject(
      user1,
      projectsOwnedByUser2[1].id,
    );
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
        ProjectsModule,
        TasksModule,
        UsersProjectsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();

    userRepository = moduleFixture.get('UserRepository');
    projectRepository = moduleFixture.get('ProjectRepository');
    taskRepository = moduleFixture.get('TaskRepository');

    authService = moduleFixture.get(AuthService);
    projectsService = moduleFixture.get(ProjectsService);
    usersProjectsService = moduleFixture.get(UsersProjectsService);
    tasksService = moduleFixture.get(TasksService);

    await app.init();

    await populateInitialData();
  });

  afterAll(async () => {
    await projectRepository.query(`DELETE FROM projects;`);
    await userRepository.query(`DELETE FROM users;`);

    await app.close();
  });

  afterEach(async () => {
    await taskRepository.query(`DELETE FROM tasks;`);
  });

  describe('POST /projects/:projectId/tasks', () => {
    it('should throw an Anauthorized error when try to create a task not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
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
        .post(`/projects/${projectsOwnedByUser1[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['title should not be empty'],
        error: 'Bad Request',
      });
    });

    it('should create a task on a project owned by the authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        projectId: projectsOwnedByUser1[0].id,
        ownerId: user1.id,
        title: 'my first task',
        description: 'description of task 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create a task on a project where the authenticated user is a participant', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser2[1].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        projectId: projectsOwnedByUser2[1].id,
        ownerId: user1.id,
        title: 'my first task',
        description: 'description of task 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should throw Not Found Error when create a task on a project owned by another user where the authenticated user is not participating', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser2[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should throw Not Found Error when create a task on a project that does not exists', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${uuid()}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should create a task on a project with right order', async () => {
      const token = user1Token;

      const task1 = await tasksService.createTaskForUser(
        {
          title: 'ttile1',
          description: '',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );
      await tasksService.createTaskForUser(
        {
          title: 'ttile2',
          description: '',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );
      await tasksService.updateStatusTask(
        task1.id,
        {
          status: 'IN_PROGRESS',
        },
        user1,
      );
      const task2 = await tasksService.updateStatusTask(
        task1.id,
        {
          status: 'OPEN',
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my first task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        projectId: projectsOwnedByUser1[0].id,
        ownerId: user1.id,
        title: 'my first task',
        description: 'description of task 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        order: 4,
      });

      expect(task2.order).toBe(3);
    });
  });

  describe('GET /projects/:projectId/tasks', () => {
    it('should throw an Anauthorized error when try to list tasks for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get(`/projects/${projectsOwnedByUser1[0]}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all tasks associated to authenticated user', async () => {
      const token = user1Token;

      await tasksService.createTaskForUser(
        {
          title: 'ttile1',
          description: '',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );
      await tasksService.createTaskForUser(
        {
          title: 'ttile2',
          description: '',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      await tasksService.createTaskForUser(
        {
          title: 'ttile2',
          description: '',
          projectId: projectsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user1,
      );
      await tasksService.createTaskForUser(
        {
          title: 'ttile3',
          description: '',
          projectId: projectsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user2,
      );
      await tasksService.createTaskForUser(
        {
          title: 'ttile4',
          description: '',
          projectId: projectsOwnedByUser2[1].id,
          ownerId: user2.id,
        },
        user2,
      );

      const response1 = await request(app.getHttpServer())
        .get(`/projects/${projectsOwnedByUser1[0].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      const response2 = await request(app.getHttpServer())
        .get(`/projects/${projectsOwnedByUser2[1].id}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response1.status).toEqual(200);
      expect(response1.body.length).toBe(2);

      expect(response2.status).toEqual(200);
      expect(response2.body.length).toBe(3);
    });
  });

  describe('UPDATE /tasks/:id', () => {
    it('should throw Not Found when update a task owned by another user', async () => {
      const token = user1Token;

      const task = await tasksService.createTaskForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          projectId: projectsOwnedByUser2[1].id,
        },
        user2,
      );
      const response = await request(app.getHttpServer())
        .put(`/tasks/${task.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my updated task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should update a task owned by the authenticated user', async () => {
      const token = user1Token;

      const task = await tasksService.createTaskForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .put(`/tasks/${task.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'my updated task',
          description: 'description of task 1',
        });

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        projectId: projectsOwnedByUser1[0].id,
        ownerId: user1.id,
        title: 'my updated task',
        description: 'description of task 1',
        status: 'OPEN',
        completedAt: null,
        id: expect.any(String),
        startedAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should throw Not Found when delete a task owned by another user', async () => {
      const token = user1Token;

      const task = await tasksService.createTaskForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          projectId: projectsOwnedByUser2[1].id,
        },
        user2,
      );
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should delete a task owned by the authenticated user', async () => {
      const token = user1Token;

      const task = await tasksService.createTaskForUser(
        {
          title: 'title1',
          description: 'teste de descrição',
          projectId: projectsOwnedByUser1[0].id,
          ownerId: user1.id,
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.total).toBe(1);
    });
  });
});
