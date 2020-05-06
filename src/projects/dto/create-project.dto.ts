import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
