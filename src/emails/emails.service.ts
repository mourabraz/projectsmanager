import { Injectable, Logger } from '@nestjs/common';
import * as Bull from 'bull';

import { EmailConsumer } from '../queue/email.consumer';
import { Invitation } from '../invitations/invitation.entity';
import { User } from '../users/user.entity';
import { Group } from '../groups/group.entity';
import { AppConfigService } from '../config/app/config.service';

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
    group: Group,
  ) {
    const queue = new Bull(EmailConsumer.channelName);

    const link = `${this.appConfigService.url}/invitations/${invitation.id}`;

    queue.add({
      payload: {
        to: invitation.emailTo,
        subject:
          'Your invite to participate in a group on the Projects Manager App ',
        template: 'NewInvitation',
        context: {
          name: invitation.emailTo,
          owner: user.name || user.email,
          groupName: group.name,
          link,
        },
      },
    });

    this.logger.verbose(
      `addInvitationEmailToQueue. Data: ${JSON.stringify(invitation)}`,
    );
  }
}
