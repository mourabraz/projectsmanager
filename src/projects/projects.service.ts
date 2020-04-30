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
  async createProject(createProjectDto: CreateProjectDto, user: User) {
    // check if groupId exists and is related to authenticated user
    await this.groupsService.getGroupById(createProjectDto.groupId, user);

    return this.projectRepository.createProject(createProjectDto);
  }
}
