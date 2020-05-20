import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationRepository } from './invitation.repository';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersProjectsModule } from '../users-projects/users-projects.module';
import { EmailsModule } from '../emails/emails.module';
import { ProjectsInvitationsController } from './projects-invitations.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationRepository]),
    AuthModule,
    ProjectsModule,
    UsersModule,
    UsersProjectsModule,
    EmailsModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController, ProjectsInvitationsController],
})
export class InvitationsModule {}
