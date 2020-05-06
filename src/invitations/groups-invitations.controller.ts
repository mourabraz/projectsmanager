import {
  Controller,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation } from './invitation.entity';

@Controller('/groups/:id/invitations')
@UseGuards(AuthGuard())
export class GroupsInvitationsController {
  private logger = new Logger(GroupsInvitationsController.name);

  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Param('id', new ParseUUIDPipe()) id: string,
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

  @Patch('/:id')
  update(@Param('id') id: string, @GetUser() user: User): Promise<Invitation> {
    return this.invitationsService.acceptInvitation(id, user);
  }
}
