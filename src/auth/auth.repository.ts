import { Repository, EntityRepository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TypeOrmErrorCode } from '../util/TypeOrmErrorCode.enum';

@EntityRepository(User)
export class AuthRepository extends Repository<User> {
  private logger = new Logger(AuthRepository.name);

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { email, password } = authCredentialsDto;

    try {
      const user = new User();
      user.email = email;
      user.password = await this.hashPassword(password);
      await this.save(user);

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to create user. Data: ${JSON.stringify(authCredentialsDto)}`,
        error.stack,
      );

      if (error.code === TypeOrmErrorCode.DUPLICATE_UNIQUE) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException();
    }
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<User | null> {
    const { email, password } = authCredentialsDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      delete user.password;

      return user;
    }

    return null;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
