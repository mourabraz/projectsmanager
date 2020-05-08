import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private logger = new Logger(UserRepository.name);

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async updateUser(updateUserDto: UpdateUserDto, user: User): Promise<User> {
    const { name, email, password } = updateUserDto;

    if (password) {
      user.password = await this.hashPassword(password);
    }

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    try {
      await this.save(user);
      delete user.password;

      return user;
    } catch (error) {
      this.logger.error(`Failed to update user "${user.email}".`, error.stack);

      throw new InternalServerErrorException();
    }
  }
}
