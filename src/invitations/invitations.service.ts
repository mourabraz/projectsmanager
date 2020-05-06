import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InvitationRepository } from './invitation.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from 'src/users/user.entity';
import { GroupsService } from 'src/groups/groups.service';
import { UsersGroupsService } from 'src/users-groups/users-groups.service';
import { EmailsService } from 'src/emails/emails.service';

@Injectable()
export class InvitationsService {
  private logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(InvitationRepository)
    private invitationRepository: InvitationRepository,
    private groupsService: GroupsService,
    private usersGroupsService: UsersGroupsService,
    private emailsService: EmailsService,
  ) {}

  async getInvitationsByGroupId(
    groupId: string,
    user: User,
  ): Promise<Invitation[]> {
    // check if groupId exists and is owned by authenticated user
    const foundGroup = await this.groupsService.getGroupByIdForOwner(
      groupId,
      user,
    );

    if (!foundGroup) {
      throw new NotFoundException();
    }

    return this.invitationRepository.getInvitationsByGroupId(groupId);
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    user: User,
  ): Promise<Invitation> {
    // check if groupId exists and is owned by the authenticated user
    const group = await this.groupsService.getGroupByIdForOwner(
      createInvitationDto.groupId,
      user,
    );

    if (!group) {
      throw new NotFoundException();
    }

    if (createInvitationDto.emailTo === user.email) {
      this.logger.error(
        `Failed to create invitation to authenticated user"${
          user.email
        }". Data: ${JSON.stringify(createInvitationDto)}`,
      );

      throw new BadRequestException(
        'Create an invite to himself is not allowed',
      );
    }

    const invitation = await this.invitationRepository.createInvitation(
      createInvitationDto,
    );

    this.logger.verbose(`Call invitation email service "${user.email}".`);
    this.emailsService.addInvitationEmailToQueue(invitation, user, group);

    return invitation;
  }

  async acceptInvitation(token: string, user: User): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, emailTo: user.email },
    });

    if (!invitation) {
      this.logger.error(
        `Failed to found invitation with ${token} for user "${user.email}".`,
      );

      throw new NotFoundException();
    }

    invitation.acceptedAt = new Date();

    try {
      await invitation.save();

      //update table users_groups
      await this.usersGroupsService.addParticipantToGroup(
        user,
        invitation.groupId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update invitation with ${token} for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }

    //send email to inviter

    return invitation;
  }

  async deleteInvitation(id: string, user: User): Promise<number> {
    const result = await this.invitationRepository.delete({
      id,
      userId: user.id,
      acceptedAt: null,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete invitation with id: "${id}".`);
      throw new NotFoundException();
    }

    return result.affected;
  }
}
