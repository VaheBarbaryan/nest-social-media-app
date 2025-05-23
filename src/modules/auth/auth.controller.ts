import { Request, Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post, Req,
  Res,
} from '@nestjs/common';
import { Public } from '@auth/decorators/public.decorator';
import { LoginDto, RegisterDto } from '@auth/dto';
import { AuthService } from '@auth/auth.service';
import { AuthHelper } from '@auth/helpers/auth.helper';

export const AUTH_CONTROLLER = 'auth' as const

export const AUTH_ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
} as const

@Controller(AUTH_CONTROLLER)
export class AuthController {

  constructor(
    private readonly authService: AuthService,
    private readonly authHelper: AuthHelper
  ) {}


  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.LOGIN)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<string> {
    const tokens = await this.authService.login(loginDto)
    this.authHelper.setAuthCookies(response, tokens);
    return 'Successfully logged in!'
  }

  @Public()
  @Post(AUTH_ROUTES.REGISTER)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<string> {
    const tokens = await this.authService.register(registerDto)
    this.authHelper.setAuthCookies(response, tokens);
    return 'Successfully registered!'
  }

  @Post(AUTH_ROUTES.LOGOUT)
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Body('userId') userId: string,
  ): Promise<string> {
    await this.authService.logout(userId);
    this.authHelper.clearAuthCookies(response);
    return 'Successfully logged out!';
  }

  @Public()
  @Post(AUTH_ROUTES.REFRESH)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const tokens = await this.authService.refreshTokens(request.cookies['refreshToken']);
    this.authHelper.setAuthCookies(response, tokens);
    return 'Tokens refreshed successfully!';
  }
}