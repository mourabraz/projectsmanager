import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { Group } from '../groups/group.entity';
import { GroupsService } from '../groups/groups.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private groupsService: GroupsService,
  ) {}

  async isUserInGroup(user: User, group: Group): Promise<boolean> {
    const groups = await this.groupsService.getGroupsForUser(user);

    return groups.findIndex(i => i.id === group.id) !== -1;
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async updateUser(updateUserDto: UpdateUserDto, user: User): Promise<User> {
    const { email } = updateUserDto;

    if (email && email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new BadRequestException('Email already used');
      }
    }

    return await this.userRepository.updateUser(updateUserDto, user);
  }
}
