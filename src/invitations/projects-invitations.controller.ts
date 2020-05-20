import {
  Controller,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  UseGuards,
  Param,
  ParseUUIDPipe,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation } from './invitation.entity';

@Controller('/projects/:projectId/invitations')
@UseGuards(AuthGuard())
export class ProjectsInvitationsController {
  private logger = new Logger(ProjectsInvitationsController.name);

  constructor(private invitationsService: InvitationsService) {}

  @Get()
  index(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @GetUser() user: User,
  ): Promise<Invitation[]> {
    this.logger.verbose(
      `User "${user.email}" retrieving all invitations for project id ${projectId}.`,
    );

    return this.invitationsService.getInvitationsByProjectId(projectId, user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Param('projectId', new ParseUUIDPipe()) id: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" creating a new invitation. Data: ${JSON.stringify(
        createInvitationDto,
      )}`,
    );

    createInvitationDto.projectId = id;
    createInvitationDto.userId = user.id;

    return this.invitationsService.createInvitation(createInvitationDto, user);
  }
}
