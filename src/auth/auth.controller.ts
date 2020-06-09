import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Logger,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshCredentialsDto } from './dto/refresh-credentials.dto';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authcredentialsDto: AuthCredentialsDto,
  ): Promise<User> {
    this.logger.verbose(
      `Create a user with email "${authcredentialsDto.email}"`,
    );

    return this.authService.signUp(authcredentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body() authcredentialsDto: AuthCredentialsDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    this.logger.verbose(
      `Login a user with email "${authcredentialsDto.email}".`,
    );

    return this.authService.signIn(authcredentialsDto);
  }

  @Post('/refresh')
  @UseGuards(AuthGuard())
  refreshToken(
    @Body() refreshcredentialsDto: RefreshCredentialsDto,
    @GetUser() user: User,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    this.logger.verbose(
      `Refresh to user with email "${refreshcredentialsDto.email}".`,
    );

    return this.authService.refreshToken(refreshcredentialsDto, user);
  }

  @Post('/forgot_password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    this.logger.verbose(
      `Request forgot password for "${forgotPasswordDto.email}".`,
    );

    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Get('/recovery/:token')
  sendRecoveryToken(
    @Param('token') token: string,
  ): Promise<{ recoveryToken: string }> {
    this.logger.verbose(`Request recovery token.`);

    return this.authService.getRecoveryToken(token);
  }
}
