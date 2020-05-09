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
import { GroupsModule } from './../src/groups/groups.module';
import { Group } from './../src/groups/group.entity';
import { GroupsService } from './../src/groups/groups.service';
import { ProjectsModule } from './../src/projects/projects.module';
import { Project } from './../src/projects/project.entity';
import { AuthService } from './../src/auth/auth.service';
import { UsersGroupsService } from './../src/users-groups/users-groups.service';
import { UsersGroupsModule } from './../src/users-groups/users-groups.module';
import { Invitation } from '../src/invitations/invitation.entity';
import { InvitationsService } from '../src/invitations/invitations.service';
import { InvitationsModule } from '../src/invitations/invitations.module';
import { uuid } from 'uuidv4';
// import { ProjectsService } from './../src/projects/projects.service';

describe('Invitation (e2e)', () => {
  let app: INestApplication;

  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let projectRepository: Repository<Project>;
  let invitationRepository: Repository<Invitation>;

  let authService: AuthService;
  let groupsService: GroupsService;
  let usersGroupsService: UsersGroupsService;
  let invitationsService: InvitationsService;

  let user1: User;
  let user2: User;
  let user1Token: string;
  let user2Token: string;

  const groupsOwnedByUser1: Group[] = [];
  const groupsOwnedByUser2: Group[] = [];

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
        TypeOrmModule.forRootAsync({
          imports: [PostgresConfigModule],
          useFactory: async (configService: PostgresConfigService) =>
            configService.typeOrmConfigTest,
          inject: [PostgresConfigService],
        }),
        AuthModule,
        UsersModule,
        GroupsModule,
        ProjectsModule,
        UsersGroupsModule,
        InvitationsModule,
      ],
    })
      .overrideProvider(EmailsService)
      .useValue(emailsService)
      .compile();

    app = moduleFixture.createNestApplication();

    userRepository = moduleFixture.get('UserRepository');
    groupRepository = moduleFixture.get('GroupRepository');
    projectRepository = moduleFixture.get('ProjectRepository');
    invitationRepository = moduleFixture.get('InvitationRepository');

    authService = moduleFixture.get(AuthService);
    groupsService = moduleFixture.get(GroupsService);
    usersGroupsService = moduleFixture.get(UsersGroupsService);
    invitationsService = moduleFixture.get(InvitationsService);

    await app.init();

    await populateInitialData();
  });

  afterAll(async () => {
    await projectRepository.query(`DELETE FROM projects;`);
    await groupRepository.query(`DELETE FROM groups;`);
    await userRepository.query(`DELETE FROM users;`);

    await app.close();
  });

  afterEach(async () => {
    await invitationRepository.query(`DELETE FROM invitations;`);

    emailsService.addInvitationEmailToQueue.mockRestore();
  });

  describe('POST /groups/:groupId/invitations', () => {
    it('should throw Unauthorized for unauthenticated user', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
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
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
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
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
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
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject({
        userId: user1.id,
        emailTo: user2.email,
        groupId: groupsOwnedByUser1[0].id,
        acceptedAt: null,
        id: expect.any(String),
      });
    });

    it('should send email when create an invitation', async () => {
      const token = user1Token;

      await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user2.email,
        });

      expect(emailsService.addInvitationEmailToQueue).toBeCalledTimes(1);
    });

    it('should not create an invitation when a prev one has accept_at value null', async () => {
      const token = user1Token;

      await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          groupId: groupsOwnedByUser1[0].id,
        },
        user1,
      );

      emailsService.addInvitationEmailToQueue.mockRestore();

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
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

    it('should not create an invitation when the user already is a participant', async () => {
      const token = user2Token;

      const response = await request(app.getHttpServer())
        .post(`/groups/${groupsOwnedByUser2[1].id}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailTo: user1.email,
        });

      expect(emailsService.addInvitationEmailToQueue).not.toBeCalled();

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'User already participate on group.',
        error: 'Bad Request',
      });
    });
  });

  describe('GET /groups/:groupId/invitations', () => {
    it('should throw an Anauthorized error when try to list invitations for a user not authenticated', async () => {
      const token = '';

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupsOwnedByUser1[0]}/invitations`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toEqual(401);
      expect(response.body).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should list all invitations associated to authenticated user by group id for the owner', async () => {
      const token = user1Token;

      await invitationsService.createInvitation(
        {
          userId: user1.id,
          emailTo: user2.email,
          groupId: groupsOwnedByUser1[0].id,
        },
        user1,
      );

      await invitationsService.createInvitation(
        {
          userId: user2.id,
          emailTo: user1.email,
          groupId: groupsOwnedByUser2[0].id,
        },
        user2,
      );

      const response = await request(app.getHttpServer())
        .get(`/groups/${groupsOwnedByUser1[0].id}/invitations`)
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
          groupId: groupsOwnedByUser1[0].id,
        },
        user1,
      );

      await invitationsService.createInvitation(
        {
          userId: user2.id,
          emailTo: user1.email,
          groupId: groupsOwnedByUser2[0].id,
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
          groupId: groupsOwnedByUser2[0].id,
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
        groupId: groupsOwnedByUser2[0].id,
        userId: user2.id,
        acceptedAt: expect.any(String),
      });
    });
  });
});
