// src/auth/auth.controller.ts
import {
  Controller, Post, Body, HttpCode, HttpStatus,
  UseGuards, Get, Req, Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { GoogleUserProfile } from './dto/google-auth.dto';
import { ConfigService } from '@nestjs/config';
import {Role} from '../auth/enums/role.enum'



@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── Google OAuth ──────────────────────────────────────────

  // Step 1: Redirect user to Google consent screen
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  googleLogin() {
    // Guard handles the redirect — this handler never actually runs
  }

  // Step 2: Google redirects back here with user profile
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUserProfile;
    const tokens = await this.authService.googleLogin(googleUser);

    const frontendUrl = this.configService.get<string>('google.frontendUrl');

    // Option A — redirect to frontend with tokens in query params
    return res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );

    // Option B — return JSON (uncomment if building mobile/SPA that handles redirect)
    // return res.json(tokens);
  }

  // ─── Token Management ──────────────────────────────────────

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @CurrentUser('userId') userId: string,
    @CurrentUser('jti') jti: string,
    @CurrentUser('email') email: string,
     @CurrentUser('role') role: Role, 
    @Body() _dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(userId, jti, email,role);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @CurrentUser('userId') userId: string,
    @CurrentUser('jti') jti: string,
    @CurrentUser('exp') exp: number,
  ) {
    return this.authService.logout(userId, jti, exp);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('jti') jti: string,
    @CurrentUser('exp') exp: number,
  ) {
    return this.authService.logoutAll(userId, jti, exp);
  }

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}