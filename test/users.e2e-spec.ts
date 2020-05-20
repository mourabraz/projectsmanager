import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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
// import { TasksService } from './../src/tasks/tasks.service';

describe('User (e2e)', () => {
  let app: INestApplication;

  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;

  let authService: AuthService;
  let projectsService: ProjectsService;
  let usersProjectsService: UsersProjectsService;
  // let tasksService: TasksService;

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
    // tasksService = moduleFixture.get(TasksService);

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
