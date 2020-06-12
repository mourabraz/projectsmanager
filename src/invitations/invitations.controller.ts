import {
  Controller,
  Logger,
  UseGuards,
  Param,
  Delete,
  ParseUUIDPipe,
  Patch,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { Invitation } from './invitation.entity';

@Controller('invitations')
@UseGuards(AuthGuard())
export class InvitationsController {
  private logger = new Logger(InvitationsController.name);

  constructor(private invitationsService: InvitationsService) {}

  @Get()
  index(@GetUser() user: User): Promise<Invitation[]> {
    this.logger.verbose(
      `User "${user.email}" retrieving all related invitations.`,
    );
    return this.invitationsService.getInvitationsToUser(user);
  }

  @Patch('/:id/accept')
  updateToAccept(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" (update) accept invitation with id: "${id}".`,
    );

    return this.invitationsService.acceptInvitation(id, user);
  }

  @Patch('/:id/leave')
  updateToLeave(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" (update) leave invitation with id: "${id}".`,
    );

    return this.invitationsService.leaveInvitation(id, user);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<{ total: number }> {
    this.logger.verbose(`User "${user.email}" delete invitation id: "${id}".`);

    return this.invitationsService.deleteInvitation(id, user);
  }
}
