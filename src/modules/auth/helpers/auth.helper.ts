import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import ms, { StringValue } from 'ms';
import { Tokens } from '../types/tokens.type';

@Injectable()
export class AuthHelper {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  setAuthCookies(response: Response, tokens: Tokens): void {
    const accessTokenExpiration = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRED_IN',
    );
    const refreshTokenExpiration = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRED_IN',
    );

    response.cookie(
      'accessToken',
      tokens.accessToken,
      this.createCookieOptions(accessTokenExpiration),
    );
    response.cookie(
      'refreshToken',
      tokens.refreshToken,
      this.createCookieOptions(refreshTokenExpiration),
    );
  }

  clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      domain: this.configService.get<string>('APP_DOMAIN'),
    });
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      domain: this.configService.get<string>('APP_DOMAIN'),
    });
  }

  private createCookieOptions(expiration: string): CookieOptions {
    const expirationInMilliseconds = ms(expiration as StringValue);
    if (!expirationInMilliseconds) {
      throw new InternalServerErrorException('Invalid expiration time');
    }

    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAge: Number(expirationInMilliseconds),
      domain: this.configService.get<string>('APP_DOMAIN'),
    };
  }
}