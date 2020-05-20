import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from '../users/user.entity';

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
