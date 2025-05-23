import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as argon2 from 'argon2';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RedisService } from '@root/common/services/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    let user: any;
    try {
      const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
      user = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException();
    }

    const hashedAccessToken = await this.redisService.get(
      `auth:user:${user.id}:accessTokenHash`,
    );
    if (
      !hashedAccessToken ||
      !(await argon2.verify(hashedAccessToken, token))
    ) {
      throw new UnauthorizedException(
        'Token is invalid or expired',
      );
    }

    request['user'] = user;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, tokenFromHeader] =
    request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      return tokenFromHeader;
    }

    return request.cookies.accessToken;
  }
}