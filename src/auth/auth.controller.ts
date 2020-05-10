import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Logger,
  Get,
  Param,
} from '@nestjs/common';

import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

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

  @Post('/forgot_password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    this.logger.verbose(
      `Request forgot password "${JSON.stringify(forgotPasswordDto)}" .`,
    );

    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Get('/recovery/:token')
  sendRecoveryToken(
    @Param('token') token: string,
  ): Promise<{ recoveryToken: string }> {
    this.logger.verbose(`Request recovery token "${JSON.stringify(token)}" .`);

    return this.authService.getRecoveryToken(token);
  }
}
