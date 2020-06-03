import {
  Controller,
  UseGuards,
  Logger,
  Put,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users')
@UseGuards(AuthGuard())
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @Put()
  @UsePipes(ValidationPipe)
  update(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<User | string> {
    this.logger.verbose(
      `User "${user.email}" update with: ${JSON.stringify(updateUserDto)}`,
    );

    return this.usersService.updateUser(updateUserDto, user);
  }
}
