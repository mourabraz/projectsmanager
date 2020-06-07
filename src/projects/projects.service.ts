import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ProjectRepository } from './project.repository';
import { User } from '../users/user.entity';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UsersProjectsService } from '../users-projects/users-projects.service';

@Injectable()
export class ProjectsService {
  private logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectRepository)
    private projectRepository: ProjectRepository,
    private usersProjectsService: UsersProjectsService,
  ) {}

  async getProjectsForUser(user: User) {
    return await this.projectRepository.getProjectsForUser(user);
  }

  async getProjectsForUserWithRelation(user: User, archived: boolean) {
    return await this.projectRepository.getProjectsForUserWithRelations(
      user,
      archived,
    );
  }

  async getProjectByIdForUser(id: string, user: User): Promise<Project> {
    const found = await this.projectRepository.getProjectByIdForUser(id, user);

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for user: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    return found;
  }

  async getProjectByIdForOwner(id: string, user: User): Promise<Project> {
    const found = await this.projectRepository.getProjectByIdForOwner(id, user);

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for owner: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    return found;
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const projectExists = await this.projectRepository.findOne({
      where: { name: createProjectDto.name, ownerId: user.id },
    });

    if (projectExists) {
      throw new BadRequestException(
        `This name "${createProjectDto.name}" is not available`,
      );
    }

    createProjectDto.ownerId = user.id;

    const project = await this.projectRepository.createProject(
      createProjectDto,
    );

    if (project) {
      await this.usersProjectsService.addParticipantToProject(user, project.id);
    }

    const projectWithRelations = this.projectRepository.getProjectByIdWithRelations(
      project.id,
    );

    return projectWithRelations;
  }

  async updateProject(
    id: string,
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const found = await this.projectRepository.findOne({
      where: {
        id,
        ownerId: user.id,
      },
    });

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for owner: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    createProjectDto.ownerId = user.id;

    return await this.projectRepository.updateProject(id, createProjectDto);
  }

  async toggleArchiveProject(
    id: string,
    user: User,
  ): Promise<{ total: number }> {
    const found = await this.projectRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for owner: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    return {
      total: (await this.projectRepository.toggleArchiveProject(found))
        .affected,
    };
  }

  async deleteProject(id: string, user: User): Promise<{ total: number }> {
    const found = await this.projectRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for owner: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    return {
      total: (await this.projectRepository.deleteProject(id)).affected,
    };
  }
}
