import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class StatusTaskDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'DONE', 'ABANDONED'])
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ABANDONED';
}
