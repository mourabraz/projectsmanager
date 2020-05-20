import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
