import { Repository, EntityRepository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { User } from 'src/users/user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TypeOrmErrorCode } from 'src/util/TypeOrmErrorCode.enum';

@EntityRepository(User)
export class AuthRepository extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { email, password } = authCredentialsDto;

    const user = new User();
    user.email = email;
    user.password = await this.hashPassword(password);

    try {
      await user.save();
    } catch (error) {
      if (error.code === TypeOrmErrorCode.DUPLICATE_UNIQUE) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException();
    }
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<string> {
    const { email, password } = authCredentialsDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    }

    return null;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
