import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { InvitationRepository } from './invitation.repository';
import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from '../users/user.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersProjectsService } from '../users-projects/users-projects.service';
import { EmailsService } from '../emails/emails.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvitationsService {
  private logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(InvitationRepository)
    private invitationRepository: InvitationRepository,
    private projectsService: ProjectsService,
    private usersProjectsService: UsersProjectsService,
    private emailsService: EmailsService,
    private usersService: UsersService,
  ) {}

  async getInvitationsByProjectId(
    projectId: string,
    user: User,
  ): Promise<Invitation[]> {
    // check if projectId exists and is owned by authenticated user
    await this.projectsService.getProjectByIdForOwner(projectId, user);

    return this.invitationRepository.getInvitationsByProjectId(projectId);
  }

  async getInvitationsToParticipate(user: User): Promise<Invitation[]> {
    return this.invitationRepository.getInvitationsToParticipate(user);
  }

  async getInvitationsToUser(user: User): Promise<Invitation[]> {
    return this.invitationRepository.getInvitationsToUser(user);
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    user: User,
  ): Promise<Invitation> {
    // check if projectId exists and is owned by the authenticated user
    const project = await this.projectsService.getProjectByIdForOwner(
      createInvitationDto.projectId,
      user,
    );

    // check if emailTo belongs to a valid user
    const participant = await this.usersService.getUserByEmail(
      createInvitationDto.emailTo,
    );

    // check if invited is not already a participant
    const usersProjects = await this.usersProjectsService.isUserByIdInProjectById(
      participant.id,
      createInvitationDto.projectId,
    );
    if (usersProjects) {
      throw new BadRequestException('User already participate on project.');
    }

    if (createInvitationDto.emailTo === user.email) {
      throw new BadRequestException(
        'Create an invite to himself is not allowed',
      );
    }

    const prevValidInvitation = await this.invitationRepository.findOne({
      where: {
        emailTo: createInvitationDto.emailTo,
        projectId: createInvitationDto.projectId,
        acceptedAt: null,
      },
    });

    if (prevValidInvitation) {
      throw new BadRequestException('A pending invitation already exists.');
    }

    const invitation = await this.invitationRepository.createInvitation(
      createInvitationDto,
    );

    this.logger.verbose(`Send invitation email to "${user.email}".`);
    this.emailsService.addInvitationEmailToQueue(invitation, user, project);

    return invitation;
  }

  async acceptInvitation(id: string, user: User): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id, emailTo: user.email },
    });

    if (!invitation) {
      this.logger.error(
        `Failed to found invitation with id "${id}" for user "${user.email}".`,
      );

      throw new NotFoundException();
    }

    invitation.acceptedAt = new Date();

    try {
      await this.invitationRepository.save(invitation);

      //update table users_projects
      await this.usersProjectsService.addParticipantToProject(
        user,
        invitation.projectId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update invitation with id "${id}" for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }

    return invitation;
  }

  async deleteInvitation(id: string, user: User): Promise<{ total: number }> {
    const result = await this.invitationRepository.delete({
      id,
      userId: user.id,
      acceptedAt: null,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete invitation with id: "${id}".`);

      throw new NotFoundException();
    }

    return { total: result.affected };
  }
}
