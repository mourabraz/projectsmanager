import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { User } from 'src/users/user.entity';

@Injectable()
export class EmailsService {
  constructor(@InjectQueue('emails') private queue: Queue) {}

  async addWelcomeEmailToQueue(user: User): Promise<void> {
    this.queue.add({
      to: user.email,
      subject: 'Welcome',
      template: 'NewRegistration',
      context: {
        name: user.name || user.email,
      },
    });
  }
}
