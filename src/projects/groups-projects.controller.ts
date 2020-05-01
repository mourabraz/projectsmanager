import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { Project } from './project.entity';

@Controller('/groups/:groupId/projects')
@UseGuards(AuthGuard())
export class GroupsProjectsController {
  private logger = new Logger('GroupsProjectsController');

  constructor(private projectsService: ProjectsService) {}

  @Get()
  index(
    @Param('groupId') groupId: string,
    @GetUser() user: User,
  ): Promise<Project[]> {
    this.logger.verbose(`User "${user.email}" retrieving all projects.`);
    return this.projectsService.getProjectsByGroupId(user, groupId);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Param('groupId') groupId: string,
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    this.logger.verbose(
      `User "${
        user.email
      }" creating a new project in group id: "${groupId}". Data: ${JSON.stringify(
        createProjectDto,
      )}`,
    );
    return this.projectsService.createProject(createProjectDto, groupId, user);
  }
}
