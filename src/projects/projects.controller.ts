import {
  Controller,
  UseGuards,
  Logger,
  UsePipes,
  ValidationPipe,
  Body,
  Param,
  Put,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/user.entity';
import { Project } from './project.entity';

@Controller('projects')
@UseGuards(AuthGuard())
export class ProjectsController {
  private logger = new Logger('ProjectsController');

  constructor(private projectsService: ProjectsService) {}

  @Put('/:id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    this.logger.verbose(
      `User "${user.email}" update project id: "${id}". Data: ${JSON.stringify(
        createProjectDto,
      )}`,
    );

    createProjectDto.ownerId = user.id;

    return this.projectsService.updateProject(id, createProjectDto);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<number> {
    this.logger.verbose(`User "${user.email}" delete project id: "${id}".`);

    return this.projectsService.deleteProject(id, user);
  }
}
