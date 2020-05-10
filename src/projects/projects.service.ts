import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ProjectRepository } from './project.repository';
import { User } from '../users/user.entity';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class ProjectsService {
  private logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectRepository)
    private projectRepository: ProjectRepository,
    private groupsService: GroupsService,
  ) {}

  async getProjectsByGroupId(groupId: string, user: User): Promise<Project[]> {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupByIdForUser(groupId, user);

    return this.projectRepository.getProjectsByGroupId(groupId);
  }

  async createProjectForUser(createProjectDto: CreateProjectDto, user: User) {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupByIdForUser(
      createProjectDto.groupId,
      user,
    );

    return this.projectRepository.createProject(createProjectDto);
  }

  async updateProject(
    id: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const found = await this.projectRepository.findOne({
      id,
      ownerId: createProjectDto.ownerId,
    });

    if (!found) {
      this.logger.verbose(
        `Project with id "${id}" not found for owner id: "${createProjectDto.ownerId}".`,
      );

      throw new NotFoundException();
    }

    return await this.projectRepository.updateProject(id, createProjectDto);
  }

  async deleteProject(id: string, user: User): Promise<{ total: number }> {
    const result = await this.projectRepository.delete({
      id,
      ownerId: user.id,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete project with id: "${id}".`);

      throw new NotFoundException();
    }

    return {
      total: result.affected,
    };
  }
}
