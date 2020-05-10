import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { JwtPayload } from './jwt-payload.interface';
import { AuthRepository } from './auth.repository';
import { User } from '../users/user.entity';
import { AppConfigService } from '../config/app/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(AuthRepository) private authRepository: AuthRepository,
    private appConfigService: AppConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfigService.key,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { email, updatedAt } = payload;
    const user = await this.authRepository.findOne({ email, updatedAt });

    if (!user) {
      this.logger.error(
        `Failed validate user". Data: ${JSON.stringify(payload)}`,
      );

      throw new UnauthorizedException();
    }

    return user;
  }
}
