import { Injectable, Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { addHours } from 'date-fns';

import { EmailConsumer } from '../queue/email.consumer';
import { Invitation } from '../invitations/invitation.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { AppConfigService } from '../config/app/config.service';
import { ForgotPassword } from '../auth/forgotpassword.entity';

@Injectable()
export class EmailsService {
  private logger = new Logger(EmailsService.name);

  constructor(private appConfigService: AppConfigService) {}

  async addWelcomeEmailToQueue(user: User) {
    const queue = new Bull(EmailConsumer.channelName);

    queue.add({
      payload: {
        to: user.email,
        subject: 'Welcome',
        template: 'NewRegistration',
        context: {
          name: user.name || user.email,
        },
      },
    });

    this.logger.verbose(
      `addWelcomeEmailToQueue. Data: ${JSON.stringify(user)}`,
    );
  }

  async addInvitationEmailToQueue(
    invitation: Invitation,
    user: User,
    project: Project,
  ) {
    const queue = new Bull(EmailConsumer.channelName);

    const link = `${this.appConfigService.url}/invitations/${invitation.id}`;

    queue.add({
      payload: {
        to: invitation.emailTo,
        subject:
          'Your invite to participate in a project on the Projects Manager App ',
        template: 'NewInvitation',
        context: {
          name: invitation.emailTo,
          owner: user.name || user.email,
          projectName: project.name,
          link,
        },
      },
    });

    this.logger.verbose(
      `addInvitationEmailToQueue. Data: ${JSON.stringify(invitation)}`,
    );
  }

  async addForgotPasswordEmailToQueue(
    forgotPassword: ForgotPassword,
    user: User,
  ) {
    const queue = new Bull(EmailConsumer.channelName);

    const link = `${this.appConfigService.url}/auth/recovery/${forgotPassword.token}`;

    queue.add({
      payload: {
        to: user.email,
        subject: 'Your recovery password link on the Projects Manager App',
        template: 'ForgotPassword',
        context: {
          name: user.name || user.email,
          link,
          validDate: addHours(forgotPassword.updatedAt, 2).toISOString(),
        },
      },
    });

    this.logger.verbose(
      `addForgotPasswordEmailToQueue. Data: ${JSON.stringify(forgotPassword)}`,
    );
  }
}
