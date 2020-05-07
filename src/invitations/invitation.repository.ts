import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@EntityRepository(Invitation)
export class InvitationRepository extends Repository<Invitation> {
  private logger = new Logger(InvitationRepository.name);

  async getInvitationsByGroupId(groupId: string): Promise<Invitation[]> {
    try {
      return await this.find({ where: { groupId } });
    } catch (error) {
      this.logger.error(
        `Failed to get invitations for group id "${groupId}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
  ): Promise<Invitation> {
    const { emailTo, userId, groupId } = createInvitationDto;

    try {
      const invitation = new Invitation();
      invitation.userId = userId;
      invitation.emailTo = emailTo;
      invitation.groupId = groupId;

      await invitation.save();
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
