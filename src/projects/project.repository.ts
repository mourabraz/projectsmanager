import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectStatus } from './project-status.enum';

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

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const { title, description, groupId, ownerId } = createProjectDto;

    try {
      const project = new Project();
      project.groupId = groupId;
      project.ownerId = ownerId;
      project.title = title;
      project.description = description;
      project.status = ProjectStatus.OPEN;

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
  ): Promise<Project> {
    try {
      await this.update(id, {
        title: createProjectDto.title,
        description: createProjectDto.description,
      });

      return await this.findOne(id);
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
}
