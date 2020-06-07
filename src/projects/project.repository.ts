import {
  Repository,
  EntityRepository,
  DeleteResult,
  UpdateResult,
} from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';

import {
  QueryAsObject,
  transformFlatToNest,
} from '../util/postgres-query-wrap/query-as-object';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  private logger = new Logger(ProjectRepository.name);

  private concatParticipantsOfProject(dataArray: any[]) {
    const uniques = dataArray.filter(
      (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) === pos,
    );

    const diff = dataArray.filter(
      (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) !== pos,
    );

    const newList = uniques.map((i) => {
      const temp = {
        ...i,
        participants: [i.users_projects.participants],
      };

      delete temp.users_projects;

      return temp;
    });

    newList.forEach((i) => {
      const index = diff.findIndex((d) => d.id === i.id);

      if (index !== -1) {
        const indexParticipant = i.participants.findIndex(
          (p) => p.id === diff[index].users_projects.participants.id,
        );

        if (indexParticipant === -1) {
          i.participants.push(diff[index].users_projects.participants);
        }
      }
    });

    return newList;
  }

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

  async getProjectsForUserWithRelations(
    user: User,
    archived: boolean,
  ): Promise<any> {
    try {
      const whereClause = `id IN (SELECT users_projects.project_id 
        FROM users_projects WHERE users_projects.user_id = :userId )
         AND archived_at IS ${archived ? 'NOT' : ''} NULL `;
      const [qs, qp] = new QueryAsObject(
        {
          table: 'projects',
          select: `id, name, created_at, updated_at ${
            archived ? ',archived_at' : ''
          }`,
          where: whereClause,

          includes: [
            {
              table: 'users',
              select: 'id, name, email',
              as: 'owner',
              localKey: 'id',
              targetKey: 'user_id',
              includes: [
                {
                  table: 'photos',
                  virtual: {
                    field: 'url',
                    execute:
                      "CONCAT('http://192.168.8.108:8080/users/photo/', filename)",
                  },
                  as: 'photo',
                  select: 'filename, user_id, id, url',
                  localKey: 'user_id',
                  targetKey: 'id',
                },
              ],
            },
            {
              table: 'users_projects',
              select: 'project_id, user_id',
              localKey: 'project_id',
              targetKey: 'id',
              includes: [
                {
                  table: 'users',
                  as: 'participants',
                  select: 'id, name, email',
                  localKey: 'id',
                  targetKey: 'user_id',

                  includes: [
                    {
                      table: 'photos',
                      virtual: {
                        field: 'url',
                        execute:
                          "CONCAT('http://192.168.8.108:8080/users/photo/', filename)",
                      },
                      as: 'avatar',
                      select: 'filename, user_id, id, url',
                      localKey: 'user_id',
                      targetKey: 'id',
                    },
                  ],
                },
              ],
            },
          ],
        },
        { userId: user.id },
      ).getQuery();

      const result = await this.query(qs, qp);

      const res = this.concatParticipantsOfProject(transformFlatToNest(result));

      // const res = this.createQueryBuilder('projects')
      //   .select([
      //     'projects.id',
      //     'projects.name',
      //     'projects.createdAt',
      //     'projects.updatedAt',

      //     'owner.name',
      //     'owner.email',
      //     'owner.photo.filename',
      //     'owner.photo.id',
      //     'participants.email',
      //   ])
      //   .leftJoin('projects.owner', 'owner')
      //   .leftJoin('owner.photo', 'owner.photo')
      //   .leftJoinAndSelect('projects.usersProjects', 'userProject')
      //   .leftJoin('userProject.user', 'participants')
      //   .where(
      //     'projects.id IN (SELECT users_projects.project_id FROM users_projects WHERE users_projects.user_id = :userId )',
      //     { userId: user.id },
      //   ).getMany();
      // console.log(res.getQuery());

      return res;
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

  async getProjectByIdWithRelations(id: string): Promise<Project> {
    try {
      const [qs, qp] = new QueryAsObject(
        {
          table: 'projects',
          select: 'id, name, created_at, updated_at',
          where: 'id = :projectId',

          includes: [
            {
              table: 'users',
              select: 'id, name, email',
              as: 'owner',
              localKey: 'id',
              targetKey: 'user_id',
              includes: [
                {
                  table: 'photos',
                  virtual: {
                    field: 'url',
                    execute:
                      "CONCAT('http://192.168.8.108:8080/users/photo/', filename)",
                  },
                  as: 'photo',
                  select: 'filename, user_id, id, url',
                  localKey: 'user_id',
                  targetKey: 'id',
                },
              ],
            },
            {
              table: 'users_projects',
              select: 'project_id, user_id',
              localKey: 'project_id',
              targetKey: 'id',
              includes: [
                {
                  table: 'users',
                  as: 'participants',
                  select: 'id, name, email',
                  localKey: 'id',
                  targetKey: 'user_id',

                  includes: [
                    {
                      table: 'photos',
                      virtual: {
                        field: 'url',
                        execute:
                          "CONCAT('http://192.168.8.108:8080/users/photo/', filename)",
                      },
                      as: 'avatar',
                      select: 'filename, user_id, id, url',
                      localKey: 'user_id',
                      targetKey: 'id',
                    },
                  ],
                },
              ],
            },
          ],
        },
        { projectId: id },
      ).getQuery();

      const result = await this.query(qs, qp);

      const res = this.concatParticipantsOfProject(transformFlatToNest(result));

      return res[0];
    } catch (error) {
      this.logger.error(`Failed to get project with id "${id}".`, error.stack);

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

  async toggleArchiveProject(project: Project): Promise<UpdateResult> {
    const result = await this.update(project.id, {
      archivedAt: project.archivedAt ? null : new Date(),
    });

    if (result.affected === 0) {
      this.logger.error(
        `Failed to toggle archive project with id: "${project.id}".`,
      );

      throw new InternalServerErrorException();
    }

    return result;
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
