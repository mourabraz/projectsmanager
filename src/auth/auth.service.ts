import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { isBefore, subHours } from 'date-fns';

import { AuthRepository } from './auth.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../users/user.entity';
import { EmailsService } from '../emails/emails.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordRepository } from './forgot-password.repository';
import { AppConfigService } from '../config/app/config.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AuthRepository)
    private authRepository: AuthRepository,
    @InjectRepository(ForgotPasswordRepository)
    private forgotPasswordRepository: ForgotPasswordRepository,
    private jwtService: JwtService,
    private emailsService: EmailsService,
    private appConfigService: AppConfigService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const user = await this.authRepository.signUp(authCredentialsDto);
    delete user.password;

    this.logger.verbose(`Send a welcome email to "${user.email}".`);
    this.emailsService.addWelcomeEmailToQueue(user);

    return user;
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ user: User; accessToken: string }> {
    const user = await this.authRepository.validateUserPassword(
      authCredentialsDto,
    );

    if (!user || !user.email || !user.passwordUpdatedAt) {
      this.logger.verbose(
        `Failed sign in for user". Data: ${JSON.stringify(authCredentialsDto)}`,
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      email: user.email,
      passwordUpdatedAt: user.passwordUpdatedAt,
    };
    const accessToken = this.jwtService.sign(payload);

    delete user.passwordUpdatedAt;

    if (user.photo) {
      user.photo = {
        ...user.photo,
        url: `${this.appConfigService.url}/users/photo/${user.photo.filename}`,
      };
    }

    return { user, accessToken };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.authRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.verbose(
        `Failed to find user email"${JSON.stringify(email)}"`,
      );

      throw new NotFoundException();
    }
    delete user.password;

    const forgotPassword = await this.forgotPasswordRepository.createOrUpdateForgotPassword(
      email,
    );

    this.logger.verbose(`Send a forgot password email to "${email}".`);
    this.emailsService.addForgotPasswordEmailToQueue(forgotPassword, user);
  }

  async getRecoveryToken(token: string): Promise<{ recoveryToken: string }> {
    const forgotPassword = await this.forgotPasswordRepository.findOne({
      where: { token },
    });

    if (!forgotPassword) {
      this.logger.verbose('Failed to find forgot password request');

      throw new NotFoundException();
    }

    if (isBefore(forgotPassword.updatedAt, subHours(new Date(), 2))) {
      this.logger.verbose('Forgot Password request expired');

      throw new NotFoundException();
    }

    const user = await this.authRepository.findOne({
      where: { email: forgotPassword.email },
    });

    try {
      const result = await this.forgotPasswordRepository.delete({
        id: forgotPassword.id,
      });

      if (result.affected === 0) {
        throw new Error();
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete forgot password id "${forgotPassword.id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }

    const payload: JwtPayload = {
      email: user.email,
      passwordUpdatedAt: user.passwordUpdatedAt,
    };
    const recoveryToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    return { recoveryToken };
  }
}
