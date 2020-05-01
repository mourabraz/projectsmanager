import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';

import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { User } from 'src/users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authcredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    return this.authService.signUp(authcredentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body() authcredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authcredentialsDto);
  }
}
