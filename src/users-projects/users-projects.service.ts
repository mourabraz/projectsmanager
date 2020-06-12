import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserProject } from './user-project.entity';
import { UserProjectRepository } from './user-project.repository';
import { User } from '../users/user.entity';

@Injectable()
export class UsersProjectsService {
  constructor(
    @InjectRepository(UserProjectRepository)
    private userProjectRepository: UserProjectRepository,
  ) {}

  async addParticipantToProject(user: User, id: string): Promise<UserProject> {
    return this.userProjectRepository.createUserProject(user, id);
  }

  async removeParticipantToProject(
    user: User,
    id: string,
  ): Promise<{
    total: number;
  }> {
    return this.userProjectRepository.removeUserProject(user, id);
  }

  async isUserByIdInProjectById(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    return !!(await this.userProjectRepository.findOne({
      where: { userId, projectId },
    }));
  }
}
