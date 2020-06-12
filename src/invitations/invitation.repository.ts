import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from '../users/user.entity';
import {
  QueryAsObject,
  transformFlatToNest,
} from '../util/postgres-query-wrap/query-as-object';

@EntityRepository(Invitation)
export class InvitationRepository extends Repository<Invitation> {
  private logger = new Logger(InvitationRepository.name);

  async getInvitationsByProjectId(projectId: string): Promise<Invitation[]> {
    try {
      return await this.find({ where: { projectId } });
    } catch (error) {
      this.logger.error(
        `Failed to get invitations for project id "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getInvitationsToParticipate(user: User): Promise<Invitation[]> {
    try {
      return await this.find({
        where: { emailTo: user.email, acceptedAt: null },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get invitations to participate for user "${user.id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getInvitationsToUser(user: User): Promise<Invitation[]> {
    try {
      const [qs, qp] = new QueryAsObject(
        {
          table: 'invitations',
          select: `id, email_to, project_id, user_id, accepted_at, 
          created_at, updated_at`,
          //where: 'email_to = :emailTo',
          whereArray: [
            ['', 'email_to = :emailTo'],
            ['OR', 'user_id = :userId'],
          ],
          order: [['created_at', 'ASC']],

          includes: [
            {
              table: 'users',
              select: 'id, name, email',
              as: 'inviter',
              localKey: 'id',
              targetKey: 'user_id',
              includes: [
                {
                  table: 'photos',
                  virtual: {
                    field: 'url',
                    execute:
                      "CONCAT('http://192.168.8.102:8080/users/photo/', filename)",
                  },
                  as: 'photo',
                  select: 'filename, user_id, id, url',
                  localKey: 'user_id',
                  targetKey: 'id',
                },
              ],
            },
            {
              table: 'projects',
              as: 'project',
              select: 'id, name',
              localKey: 'id',
              targetKey: 'project_id',
            },
          ],
        },
        { emailTo: user.email, userId: user.id },
      ).getQuery();

      const result = await this.query(qs, qp);

      const res = transformFlatToNest(result);

      return await res;
    } catch (error) {
      this.logger.error(
        `Failed to get invitations for user "${user.id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
  ): Promise<Invitation> {
    const { emailTo, userId, projectId } = createInvitationDto;

    try {
      const invitation = new Invitation();
      invitation.userId = userId;
      invitation.emailTo = emailTo;
      invitation.projectId = projectId;

      await this.save(invitation);
      delete invitation.user;

      return invitation;
    } catch (error) {
      this.logger.error(
        `Failed to create invitation for user id"${userId}". Data: ${JSON.stringify(
          createInvitationDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
