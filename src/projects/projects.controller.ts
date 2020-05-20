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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ProjectsService } from './projects.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './project.entity';

@Controller('projects')
@UseGuards(AuthGuard())
export class ProjectsController {
  private logger = new Logger(ProjectsController.name);

  constructor(private projectsService: ProjectsService) {}

  @Get()
  index(@GetUser() user: User) {
    this.logger.verbose(`User "${user.email}" retrieving all projects.`);

    return this.projectsService.getProjectsForUser(user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    this.logger.verbose(
      `User "${user.email}" creating a new project. Data: ${JSON.stringify(
        createProjectDto,
      )}`,
    );

    return this.projectsService.createProject(createProjectDto, user);
  }

  @Patch('/:id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    this.logger.verbose(
      `User "${
        user.email
      }" update project with id: "${id}". Data: ${JSON.stringify(
        createProjectDto,
      )}`,
    );

    return this.projectsService.updateProject(id, createProjectDto, user);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<{ total: number }> {
    this.logger.verbose(
      `User "${user.email}" delete project with id: "${id}".`,
    );

    return this.projectsService.deleteProject(id, user);
  }
}
