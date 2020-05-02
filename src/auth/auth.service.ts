import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

import { AuthRepository } from './auth.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from 'src/users/user.entity';
import { EmailsService } from 'src/queue/emails.service';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(AuthRepository)
    private userRepository: AuthRepository,
    private jwtService: JwtService,
    private emailsService: EmailsService,
    private readonly mailerService: MailerService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const user = await this.userRepository.signUp(authCredentialsDto);

    // Send welcome e-mail
    this.emailsService.addWelcomeEmailToQueue(user);

    // this.mailerService.sendMail({
    //   to: user.email,
    //   subject: 'Welcome',
    //   template: 'NewRegistration',
    //   context: {
    //     name: user.name || user.email,
    //   },
    // });

    this.logger.verbose(`call email service "${user.email}".`);

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
