import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { AuthRepository } from './auth.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../users/user.entity';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(AuthRepository)
    private userRepository: AuthRepository,
    private jwtService: JwtService,
    private emailsService: EmailsService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const user = await this.userRepository.signUp(authCredentialsDto);
    delete user.password;

    this.logger.verbose(`Call welcome email service "${user.email}".`);

    this.emailsService.addWelcomeEmailToQueue(user);

    return user;
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const email = await this.userRepository.validateUserPassword(
      authCredentialsDto,
    );

    if (!email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
