import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationRepository } from './invitation.repository';
import { AuthModule } from 'src/auth/auth.module';
import { GroupsModule } from 'src/groups/groups.module';
import { UsersGroupsModule } from 'src/users-groups/users-groups.module';
import { EmailsModule } from 'src/emails/emails.module';
import { GroupsInvitationsController } from './groups-invitations.controller';
import { UsersModule } from 'src/users/users.module';

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
