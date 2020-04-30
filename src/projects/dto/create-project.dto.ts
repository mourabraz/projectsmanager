import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description: string;
}
