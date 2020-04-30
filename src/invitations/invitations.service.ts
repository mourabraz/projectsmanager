import { Injectable } from '@nestjs/common';

import { InvitationRepository } from './invitation.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from 'src/users/user.entity';
import { GroupsService } from 'src/groups/groups.service';
import { UsersGroupsService } from 'src/users-groups/users-groups.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationRepository)
    private invitationRepository: InvitationRepository,
    private groupsService: GroupsService,
    private usersGroupsService: UsersGroupsService,
  ) {}

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    user: User,
  ): Promise<Invitation> {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupById(createInvitationDto.groupId, user);

    //Enviar email com o link para ativar o convite

    return this.invitationRepository.createInvitation(
      createInvitationDto,
      user,
    );
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
