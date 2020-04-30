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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation } from './invitation.entity';

@Controller('invitations')
@UseGuards(AuthGuard())
export class InvitationsController {
  private logger = new Logger('TasksController');

  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Body() createInvitationDto: CreateInvitationDto,
    @GetUser() user: User,
  ): Promise<Invitation> {
    this.logger.verbose(
      `User "${user.email}" creating a new invitation. Data: ${JSON.stringify(
        createInvitationDto,
      )}`,
    );

    return this.invitationsService.createInvitation(createInvitationDto, user);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @GetUser() user: User): Promise<Invitation> {
    return this.invitationsService.acceptInvitation(id, user);
  }
}
