import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateStepDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
