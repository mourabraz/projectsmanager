import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './jwt.strategy';
import { AppConfigModule } from '../config/app/config.module';
import { AppConfigService } from '../config/app/config.service';
import { EmailsModule } from '../emails/emails.module';
import { ForgotPasswordRepository } from './forgot-password.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: async (configService: AppConfigService) => ({
        secret: configService.key,
        signOptions: {
          expiresIn: configService.experiesIn,
        },
      }),
      inject: [AppConfigService],
    }),
    TypeOrmModule.forFeature([AuthRepository, ForgotPasswordRepository]),
    AppConfigModule,
    EmailsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
