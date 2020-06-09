import { IsString, IsEmail } from 'class-validator';

export class RefreshCredentialsDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  data: string;
}
