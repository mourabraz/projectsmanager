import { Controller, Post, Body, ValidationPipe, Logger } from '@nestjs/common';

import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authcredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    this.logger.verbose(
      `Create a user with data "${JSON.stringify(authcredentialsDto)}" .`,
    );

    return this.authService.signUp(authcredentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body() authcredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    this.logger.verbose(
      `Login a user with data "${JSON.stringify(authcredentialsDto)}" .`,
    );
    return this.authService.signIn(authcredentialsDto);
  }
}
