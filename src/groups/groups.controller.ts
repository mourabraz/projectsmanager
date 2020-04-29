import {
  Controller,
  Logger,
  UseGuards,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { GroupsService } from './groups.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './group.entity';

@Controller('groups')
@UseGuards(AuthGuard())
export class GroupsController {
  private logger = new Logger('GroupsController');

  constructor(private groupsService: GroupsService) {}

  @Get()
  index(@GetUser() user: User) {
    this.logger.verbose(`User "${user.email}" retrieving all groups.`);
    return this.groupsService.getGroups(user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: User,
  ): Promise<Group> {
    this.logger.verbose(
      `User "${user.email}" creating a new group. Data: ${JSON.stringify(
        createGroupDto,
      )}`,
    );
    return this.groupsService.createGroup(createGroupDto, user);
  }

  @Patch('/:id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id') id: string,
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: User,
  ): Promise<Group> {
    this.logger.verbose(
      `User "${
        user.email
      }" update group with id: "${id}". Data: ${JSON.stringify(
        createGroupDto,
      )}`,
    );

    return this.groupsService.updateGroup(id, createGroupDto, user);
  }

  @Delete('/:id')
  destroy(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.logger.verbose(`User "${user.email}" delete group with id: "${id}".`);
    return this.groupsService.deleteGroup(id, user);
  }
}
