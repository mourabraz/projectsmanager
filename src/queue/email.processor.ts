import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger('EmailProcessor');

  constructor(private readonly mailerService: MailerService) {}

  @Process()
  async handle(job: Job) {
    this.logger.verbose('Send email on queue...');
    console.log(job.data);
    console.log('handle email process ', process.pid);

    await this.mailerService.sendMail(job.data);

    this.logger.verbose('Email on queue handled');
  }
}
