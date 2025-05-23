import { Request, Response } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Public } from '@auth/decorators/public.decorator';
import { LoginDto, RegisterDto } from '@auth/dto';
import { AuthService } from '@auth/auth.service';
import { AuthHelper } from '@auth/helpers/auth.helper';

export const AUTH_CONTROLLER = 'auth' as const;

export const AUTH_ROUTES = {
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  REFRESH: 'refresh',
} as const;

@ApiTags('Authentication')
@Controller(AUTH_CONTROLLER)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authHelper: AuthHelper,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.LOGIN)
  @ApiOperation({ summary: 'Login', description: 'Logs in a user and sets auth cookies.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const tokens = await this.authService.login(loginDto);
    this.authHelper.setAuthCookies(response, tokens);
    return 'Successfully logged in!';
  }

  @Public()
  @Post(AUTH_ROUTES.REGISTER)
  @ApiOperation({ summary: 'Register', description: 'Registers a new user and sets auth cookies.' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Successfully registered.' })
  @ApiResponse({ status: 400, description: 'Validation failed or user already exists.' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const tokens = await this.authService.register(registerDto);
    this.authHelper.setAuthCookies(response, tokens);
    return 'Successfully registered!';
  }

  @Post(AUTH_ROUTES.LOGOUT)
  @ApiOperation({ summary: 'Logout', description: 'Logs out a user and clears auth cookies.' })
  @ApiCookieAuth()
  @ApiBody({ schema: { properties: { userId: { type: 'string', example: 'user-123' } } } })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 400, description: 'User ID missing or invalid.' })
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
  @ApiOperation({ summary: 'Refresh Tokens', description: 'Refreshes access and refresh tokens using the refresh token in cookies.' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token.' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const tokens = await this.authService.refreshTokens(request.cookies['refreshToken']);
    this.authHelper.setAuthCookies(response, tokens);
    return 'Tokens refreshed successfully!';
  }
}