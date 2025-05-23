import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from '@auth/dto';
import { DatabaseService } from '@database/database.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from '@auth/types/tokens.type';
import { RedisService } from '@common/services/redis.service';

import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Tokens> {
    const user = await this.databaseService
      .db('users')
      .where('email', registerDto.email)
      .first();

    if (user) {
      throw new BadRequestException('User with this email already exists.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const [newUser] = await this.databaseService
      .db('users')
      .insert({
        email: registerDto.email,
        password: hashedPassword,
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        age: registerDto.age,
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'created_at']);

    return await this.issueTokens(newUser);
  }

  async login({ email, password }: LoginDto): Promise<Tokens> {
    const user = await this.databaseService
      .db('users')
      .where('email', email)
      .first()

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid email or password');
    }

    const { password: _, ...userInfo } = user
    return await this.issueTokens(userInfo);
  }


  async logout(userId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`auth:user:${userId}:accessTokenHash`),
      this.redisService.del(`auth:user:${userId}:refreshTokenHash`),
    ]);
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedHash = await this.redisService.get(
      `auth:user:${payload.id}:refreshTokenHash`,
    );
    if (!storedHash || !(await argon2.verify(storedHash, refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.databaseService
      .db('users')
      .where('id', payload.id)
      .first();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...userInfo } = user;
    return await this.issueTokens(userInfo);
  }


  async issueTokens(user): Promise<Tokens> {
    const tokens = await this.generateTokens(user);
    await this.updateAccessHash(user.id, tokens.accessToken);
    await this.updateRefreshHash(user.id, tokens.refreshToken);
    return tokens;
  }

  private async generateTokens(payload): Promise<Tokens> {
    const { id, ...data } = payload;
    const cleanPayload = {
      id,
      sub: id,
      ...data,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(cleanPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRED_IN',
        ),
      }),
      this.jwtService.signAsync(cleanPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRED_IN',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateAccessHash(
    userId: string,
    accessToken: string,
  ): Promise<void> {
    const hash = await argon2.hash(accessToken);
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRED_IN',
    );

    const expirationInMilliseconds = ms(expiresIn as StringValue);

    if (!expirationInMilliseconds) {
      throw new BadRequestException('Invalid Duration Format');
    }

    const expirationInSeconds = Math.floor(
      Number(expirationInMilliseconds) / 1000,
    );

    await this.redisService.set(
      `auth:user:${userId}:accessTokenHash`,
      hash,
      expirationInSeconds,
    );
  }

  private async updateRefreshHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await argon2.hash(refreshToken);
    await this.redisService.set(`auth:user:${userId}:refreshTokenHash`, hash);
  }
}