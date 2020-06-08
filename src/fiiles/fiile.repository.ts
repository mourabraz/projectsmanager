import { Repository, EntityRepository } from 'typeorm';

import { Fiile } from './fiile.entity';

@EntityRepository(Fiile)
export class FiileRepository extends Repository<Fiile> {}
