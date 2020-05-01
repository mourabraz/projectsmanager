import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ProjectRepository } from './project.repository';
import { User } from 'src/users/user.entity';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectRepository)
    private projectRepository: ProjectRepository,
    private groupsService: GroupsService,
  ) {}

  async getProjectsByGroupId(user: User, groupId: string): Promise<Project[]> {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupById(groupId, user);

    return this.projectRepository.getProjectsByGroupId(groupId);
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    groupId: string,
    user: User,
  ) {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupById(groupId, user);

    return this.projectRepository.createProject(
      createProjectDto,
      groupId,
      user,
    );
  }

  async updateProject(
    id: string,
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const groups = await this.groupsService.getGroups(user);
    user.groups = groups;

    return await this.projectRepository.updateProject(
      id,
      createProjectDto,
      user,
    );
  }

  async deleteProject(id: string, user: User): Promise<void> {
    return this.projectRepository.deleteProject(id, user);
  }
}
