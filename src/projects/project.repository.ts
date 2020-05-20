import { Repository, EntityRepository, DeleteResult } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  private logger = new Logger(ProjectRepository.name);

  async getProjectsForUser(user: User): Promise<Project[]> {
    try {
      return await this.query(
        `SELECT projects.id, projects.name FROM projects
      INNER JOIN users_projects ON projects.id = users_projects.project_id 
      INNER JOIN users ON users_projects.user_id = users.id
      WHERE users.id = $1`,
        [user.id],
      );
    } catch (error) {
      this.logger.error(
        `Failed to get projects for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getProjectByIdForUser(id: string, user: User): Promise<Project> {
    try {
      const projects = await this.query(
        `SELECT projects.id FROM projects
      INNER JOIN users_projects ON users_projects.project_id = projects.id
      INNER JOIN users ON users_projects.user_id = users.id
      WHERE users.id = $1 AND projects.id = $2 LIMIT 1`,
        [user.id, id],
      );

      return projects[0];
    } catch (error) {
      this.logger.error(
        `Failed to get project with id: "${id}" for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getProjectByIdForOwner(id: string, user: User): Promise<Project> {
    try {
      return await this.findOne({
        where: { id, ownerId: user.id },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find project by id: "${id}" for owner "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const { name, ownerId: userId } = createProjectDto;

    try {
      const project = new Project();
      project.ownerId = userId;
      project.name = name;

      await this.save(project);

      delete project.owner;

      return project;
    } catch (error) {
      this.logger.error(
        `Failed to create project for user id "${userId}". Data: ${JSON.stringify(
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
      await this.update(id, { name: createProjectDto.name });

      return await this.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to update project with id: "${id}" for owner id "${
          createProjectDto.ownerId
        }". Data: ${JSON.stringify(createProjectDto)}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async deleteProject(id: string): Promise<DeleteResult> {
    const result = await this.delete({ id });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete project with id: "${id}".`);

      throw new InternalServerErrorException();
    }

    return result;
  }
}
