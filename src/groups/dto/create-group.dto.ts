import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
