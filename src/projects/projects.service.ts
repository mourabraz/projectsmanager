import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ProjectRepository } from './project.repository';
import { User } from 'src/users/user.entity';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GroupsService } from 'src/groups/groups.service';

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
    const foundGroup = await this.groupsService.getGroupByIdForUser(
      groupId,
      user,
    );

    if (!foundGroup) {
      throw new NotFoundException();
    }

    return this.projectRepository.getProjectsByGroupId(groupId);
  }

  async createProjectForUser(createProjectDto: CreateProjectDto, user: User) {
    // check if groupId exists and is related to authenticated user
    const foundGroup = await this.groupsService.getGroupByIdForUser(
      createProjectDto.groupId,
      user,
    );

    if (!foundGroup) {
      throw new NotFoundException();
    }

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
      throw new NotFoundException();
    }

    return await this.projectRepository.updateProject(id, createProjectDto);
  }

  async deleteProject(id: string, user: User): Promise<number> {
    const result = await this.projectRepository.delete({
      id,
      ownerId: user.id,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete project with id: "${id}".`);
      throw new NotFoundException();
    }

    return result.affected;
  }
}
