// src/auth/strategies/access-token.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { Role } from '../enums/role.enum';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;       // ← role now in JWT payload
  jti: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'), // ✅ FIX
  passReqToCallback: false,
});
  }

  async validate(payload: AccessTokenPayload) {
    const isBlacklisted = await this.redisService.isAccessTokenBlacklisted(payload.jti);
    if (isBlacklisted) throw new UnauthorizedException('Token has been revoked');

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,     // ← attached to req.user
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}