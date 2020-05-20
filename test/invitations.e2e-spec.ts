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
import { Invitation } from '../src/invitations/invitation.entity';
import { InvitationsService } from '../src/invitations/invitations.service';
import { InvitationsModule } from '../src/invitations/invitations.module';
import { uuid } from 'uuidv4';
// import { TasksService } from './../src/tasks/tasks.service';

describe('Invitation (e2e)', () => {
  let app: INestApplication;

  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let taskRepository: Repository<Task>;
  let invitationRepository: Repository<Invitation>;

  let authService: AuthService;
  let projectsService: ProjectsService;
  let usersProjectsService: UsersProjectsService;
  let invitationsService: InvitationsService;

  let user1: User;
  let user2: User;
  let user1Token: string;
  let user2Token: string;

  const projectsOwnedByUser1: Project[] = [];
  const projectsOwnedByUser2: Project[] = [];

  const emailsService = {
    addWelcomeEmailToQueue: jest.fn(),
    addInvitationEmailToQueue: jest.fn(),
  };

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

    user2Token = (
      await authService.signIn({
        email: user2.email,
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
        InvitationsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();

    userRepository = moduleFixture.get('UserRepository');
    projectRepository = moduleFixture.get('ProjectRepository');
    taskRepository = moduleFixture.get('TaskRepository');
    invitationRepository = moduleFixture.get('InvitationRepository');

    authService = moduleFixture.get(AuthService);
    projectsService = moduleFixture.get(ProjectsService);
    usersProjectsService = moduleFixture.get(UsersProjectsService);
    invitationsService = moduleFixture.get(InvitationsService);

    await app.init();

    await populateInitialData();
  });

  afterAll(async () => {
    await taskRepository.query(`DELETE FROM tasks;`);
    await projectRepository.query(`DELETE FROM projects;`);
    await userRepository.query(`DELETE FROM users;`);

    await app.close();
  });

  afterEach(async () => {
    await invitationRepository.query(`DELETE FROM invitations;`);

    emailsService.addInvitationEmailToQueue.mockRestore();
  });

  describe('POST /projects/:projectId/invitations', () => {
    it('should throw Unauthorized for unauthenticated user', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: 'fulano@fulano.com',
        });

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw Not Found when emailTo does not exists', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: 'fulano@fulano.com',
        });

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should validate emailTo', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: 'fulanofulano.com',
        });

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: ['emailTo must be an email'],
      });
    });

    it('should create an invitation', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        userId: user1.id,
        emailTo: user2.email,
        projectId: projectsOwnedByUser1[0].id,
        acceptedAt: null,
        id: expect.any(String),
      });
    });

    it('should send email when create an invitation', async () => {
      const token = user1Token;

      await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(emailsService.addInvitationEmailToQueue).toBeCalledTimes(1);
    });

    it('should throw error with a project that does not exits or does not belongs to authenticated user', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${uuid()}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      const response1 = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser2[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(emailsService.addInvitationEmailToQueue).not.toBeCalled();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });

      expect(response1.status).toEqual(404);
      expect(response1.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should not create an invitation when a prev one has accept_at value null', async () => {
      const token = user1Token;

      await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          projectId: projectsOwnedByUser1[0].id,
        },
        user1,
      );

      emailsService.addInvitationEmailToQueue.mockRestore();

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(emailsService.addInvitationEmailToQueue).not.toBeCalled();

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'A pending invitation already exists.',
        error: 'Bad Request',
      });
    });

    it('should not create an invitation to himself', async () => {
      const token = user1Token;

      let project = new Project();
      project.ownerId = user1.id;
      project.name = 'TESTE';
      project = await projectRepository.save(project);

      const response = await request(app.getHttpServer())
        .post(`/projects/${project.id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user1.email,
        });

      expect(emailsService.addInvitationEmailToQueue).not.toBeCalled();

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Create an invite to himself is not allowed',
        error: 'Bad Request',
      });

      await projectRepository.remove(project);
    });

    it('should not create an invitation when the user already is a participant', async () => {
      const token = user2Token;

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectsOwnedByUser2[1].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user1.email,
        });

      expect(emailsService.addInvitationEmailToQueue).not.toBeCalled();

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'User already participate on project.',
        error: 'Bad Request',
      });
    });
  });

  describe('GET /projects/:projectId/invitations', () => {
    it('should throw an Anauthorized error when try to list invitations for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get(`/projects/${projectsOwnedByUser1[0]}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all invitations associated to authenticated user by project id for the owner', async () => {
      const token = user1Token;

      await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          projectId: projectsOwnedByUser1[0].id,
        },
        user1,
      );

      await invitationsService.createInvitation(
        {
          userId: user2.id,
          emailTo: user1.email,
          projectId: projectsOwnedByUser2[0].id,
        },
        user2,
      );

      const response = await request(app.getHttpServer())
        .get(`/projects/${projectsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe('GET /invitations', () => {
    it('should throw an Anauthorized error when try to list invitations for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get('/invitations')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all invitations associated to authenticated user when not the owner', async () => {
      const token = user1Token;

      await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          projectId: projectsOwnedByUser1[0].id,
        },
        user1,
      );

      await invitationsService.createInvitation(
        {
          userId: user2.id,
          emailTo: user1.email,
          projectId: projectsOwnedByUser2[0].id,
        },
        user2,
      );

      const response = await request(app.getHttpServer())
        .get('/invitations')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe('UPDATE /invitations/:id/accept', () => {
    it('should throw Not Found when accept an invitation that does not exists', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .patch(`/invitations/${uuid()}/accept`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should accept an invitation', async () => {
      const token = user1Token;

      const invitation = await invitationsService.createInvitation(
        {
          userId: user2.id,
          emailTo: user1.email,
          projectId: projectsOwnedByUser2[0].id,
        },
        user2,
      );

      const response = await request(app.getHttpServer())
        .patch(`/invitations/${invitation.id}/accept`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        emailTo: user1.email,
        projectId: projectsOwnedByUser2[0].id,
        userId: user2.id,
        acceptedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /invitations/:id', () => {
    it('should throw Not Found when accept an invitation that does not exists', async () => {
      const token = user1Token;

      const response = await request(app.getHttpServer())
        .delete(`/invitations/${uuid()}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'Not Found',
      });
    });

    it('should delete an invitation by the owner if it has not been accepted', async () => {
      const token = user1Token;

      const invitation = await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          projectId: projectsOwnedByUser1[0].id,
        },
        user1,
      );

      const response = await request(app.getHttpServer())
        .delete(`/invitations/${invitation.id}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject({ total: 1 });
    });
  });
});
