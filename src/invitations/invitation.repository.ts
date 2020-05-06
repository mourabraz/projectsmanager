import { Repository, EntityRepository } from 'typeorm';

import { Invitation } from './invitation.entity';
import {
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from 'src/users/user.entity';

@EntityRepository(Invitation)
export class InvitationRepository extends Repository<Invitation> {
  private logger = new Logger('InvitationRepository');

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

  async updateInvitation(id: string, user: User): Promise<Invitation> {
    const invitation = await this.findOne({
      where: { id, emailTo: user.email },
    });

    if (!invitation) {
      this.logger.error(
        `Failed to found invitation with ${id} for user "${user.email}".`,
      );

      throw new NotFoundException();
    }

    try {
      invitation.acceptedAt = new Date();

      return await invitation.save();
    } catch (error) {
      this.logger.error(
        `Failed to update invitation with id "${id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
