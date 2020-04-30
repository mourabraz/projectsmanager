import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsNotEmpty()
  @IsEmail()
  emailTo: string;

  @IsNotEmpty()
  @IsUUID()
  groupId: string;
}
