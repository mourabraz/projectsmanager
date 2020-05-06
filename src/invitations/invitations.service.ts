import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
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

  async acceptInvitation(id: string, user: User): Promise<Invitation> {
    //update date on acceptedAt
    const invitation = await this.invitationRepository.updateInvitation(
      id,
      user,
    );

    //update table users_groups (groupId already confirmed to proced)
    await this.usersGroupsService.addParticipantToGroup(
      user,
      invitation.groupId,
    );

    //send email to inviter

    return invitation;
  }
}
