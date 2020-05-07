import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationRepository } from './invitation.repository';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { UsersGroupsModule } from '../users-groups/users-groups.module';
import { EmailsModule } from '../emails/emails.module';
import { GroupsInvitationsController } from './groups-invitations.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationRepository]),
    AuthModule,
    GroupsModule,
    UsersModule,
    UsersGroupsModule,
    EmailsModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController, GroupsInvitationsController],
})
export class InvitationsModule {}
