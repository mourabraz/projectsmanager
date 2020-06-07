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
  ParseUUIDPipe,
  Put,
  Patch,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ProjectsService } from './projects.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './project.entity';
import { GetProjectsFilterDto } from './dto/get-projects-filter.dto';

@Controller('projects')
@UseGuards(AuthGuard())
export class ProjectsController {
  private logger = new Logger(ProjectsController.name);

  constructor(private projectsService: ProjectsService) {}

  @Get()
  index(
    @Query() filterDto: GetProjectsFilterDto,
    @GetUser() user: User,
  ): Promise<Project[]> {
    this.logger.verbose(`User "${user.email}" retrieving all projects.`);

    let archived = false;
    if (Object.keys(filterDto).length) {
      archived = filterDto.hasOwnProperty('archived');
    }

    return this.projectsService.getProjectsForUserWithRelation(user, archived);
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

  @Put('/:id')
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

  @Patch('/:id/archive')
  archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<{ total: number }> {
    this.logger.verbose(
      `User "${user.email}" toggle archive project with id: "${id}".`,
    );

    return this.projectsService.toggleArchiveProject(id, user);
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
