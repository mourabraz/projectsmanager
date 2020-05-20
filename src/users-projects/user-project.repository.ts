import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { UserProject } from './user-project.entity';
import { User } from '../users/user.entity';

@EntityRepository(UserProject)
export class UserProjectRepository extends Repository<UserProject> {
  private logger = new Logger(UserProjectRepository.name);

  async createUserProject(user: User, projectId: string): Promise<UserProject> {
    try {
      const userProject = new UserProject();
      userProject.userId = user.id;
      userProject.projectId = projectId;

      await this.save(userProject);
      // delete userProject.user;

      return userProject;
    } catch (error) {
      this.logger.error(
        `Failed to add participante "${user.email}" in project id: "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
