import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationRepository } from './invitation.repository';
import { AuthModule } from 'src/auth/auth.module';
import { GroupsModule } from 'src/groups/groups.module';
import { UsersGroupsModule } from 'src/users-groups/users-groups.module';
import { EmailsModule } from 'src/emails/emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationRepository]),
    AuthModule,
    GroupsModule,
    UsersGroupsModule,
    EmailsModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
