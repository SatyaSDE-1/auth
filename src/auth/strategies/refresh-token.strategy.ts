// src/auth/strategies/refresh-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { Request } from 'express';
import {Role} from '../enums/role.enum'

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  jti: string;
   role: Role;
  iat?: number;
  exp?: number;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      // Fix: assert non-null
      secretOrKey: configService.get<string>('jwt.refreshSecret') as string,
      // Fix: passReqToCallback: true requires StrategyOptionsWithRequest cast
      passReqToCallback: true as true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const isValid = await this.redisService.isRefreshTokenValid(payload.sub, payload.jti);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      jti: payload.jti,
        role: payload.role,
    };
  }
}