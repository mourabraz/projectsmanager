import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { ForgotPassword } from './forgotpassword.entity';

@EntityRepository(ForgotPassword)
export class ForgotPasswordRepository extends Repository<ForgotPassword> {
  private logger = new Logger(ForgotPasswordRepository.name);

  async createOrUpdateForgotPassword(email: string): Promise<ForgotPassword> {
    try {
      const found = await this.findOne({
        where: { email },
      });

      const token = crypto.randomBytes(16).toString('hex');

      const forgotPassword = new ForgotPassword();
      forgotPassword.id = found?.id;
      forgotPassword.email = email;
      forgotPassword.token = token;

      await this.save(forgotPassword);

      return forgotPassword;
    } catch (error) {
      this.logger.error(
        `Failed to create or update forgot password for "${email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
