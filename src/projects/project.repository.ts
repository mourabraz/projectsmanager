import { Repository, EntityRepository, In } from 'typeorm';
import {
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectStatus } from './project-status.enum';
import { User } from 'src/users/user.entity';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  private logger = new Logger('ProjectRepository');

  async getProjectsByGroupId(groupId: string): Promise<Project[]> {
    try {
      return await this.find({ where: { groupId } });
    } catch (error) {
      this.logger.error(
        `Failed to get projects for group id "${groupId}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getProjectById(id: string, user: User): Promise<Project> {
    try {
      const groupsIds = user.groups.map(i => i.id);

      const project = await this.findOne({
        where: { id, groupId: In(groupsIds) },
      });

      return project;
    } catch (error) {
      this.logger.error(`Failed to get project with id "${id}".`, error.stack);
      throw new InternalServerErrorException();
    }
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    groupId: string,
    user: User,
  ): Promise<Project> {
    const { title, description } = createProjectDto;

    const project = new Project();
    project.groupId = groupId;
    project.ownerId = user.id;
    project.title = title;
    project.description = description;
    project.status = ProjectStatus.OPEN;

    try {
      await project.save();

      return project;
    } catch (error) {
      this.logger.error(
        `Failed to create project for group. Data: ${JSON.stringify(
          createProjectDto,
        )}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async updateProject(
    id: string,
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const project: Project = await this.getProjectById(id, user);
    project.title = createProjectDto.title;
    project.description = createProjectDto.description;

    try {
      await project.save();

      return project;
    } catch (error) {
      this.logger.error(
        `Failed to update project with id: "${id}". Data: ${JSON.stringify(
          createProjectDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async deleteProject(id: string, user: User): Promise<void> {
    const result = await this.delete({ id, ownerId: user.id });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete project with id: "${id}".`);
      throw new NotFoundException();
    }
  }
}
