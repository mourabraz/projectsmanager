import {
  Controller,
  Logger,
  UseGuards,
  Param,
  Delete,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { Invitation } from './invitation.entity';

@Controller('invitations')
@UseGuards(AuthGuard())
export class InvitationsController {
  private logger = new Logger(InvitationsController.name);

  constructor(private invitationsService: InvitationsService) {}

  @Patch('/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" update invitation with id: "${id}".`,
    );

    return this.invitationsService.acceptInvitation(id, user);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<number> {
    this.logger.verbose(`User "${user.email}" delete invitation id: "${id}".`);

    return this.invitationsService.deleteInvitation(id, user);
  }
}
