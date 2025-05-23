import { Module } from '@nestjs/common';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { AuthHelper } from '@auth/helpers/auth.helper';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from '@common/services/redis.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthHelper, RedisService],
})
export class AuthModule {}