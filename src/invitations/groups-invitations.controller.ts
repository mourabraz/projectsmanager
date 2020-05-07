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

@Controller('/groups/:groupId/invitations')
@UseGuards(AuthGuard())
export class GroupsInvitationsController {
  private logger = new Logger(GroupsInvitationsController.name);

  constructor(private invitationsService: InvitationsService) {}

  @Get()
  index(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @GetUser() user: User,
  ): Promise<Invitation[]> {
    this.logger.verbose(
      `User "${user.email}" retrieving all invitations for group id ${groupId}.`,
    );
    return this.invitationsService.getInvitationsByGroupId(groupId, user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Param('groupId', new ParseUUIDPipe()) id: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" creating a new invitation. Data: ${JSON.stringify(
        createInvitationDto,
      )}`,
    );

    createInvitationDto.groupId = id;
    createInvitationDto.userId = user.id;

    return this.invitationsService.createInvitation(createInvitationDto, user);
  }
}
