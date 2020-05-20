import { IsEmail, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  emailTo: string;

  @IsUUID()
  @IsOptional()
  userId: string;

  @IsUUID()
  @IsOptional()
  projectId: string;
}
