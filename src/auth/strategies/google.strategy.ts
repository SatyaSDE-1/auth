// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleUserProfile } from '../dto/google-auth.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
   super({
  clientID: configService.getOrThrow<string>('google.clientId'),
  clientSecret: configService.getOrThrow<string>('google.clientSecret'),
  callbackURL: configService.getOrThrow<string>('google.callbackUrl'),
  scope: ['openid', 'profile', 'email'],
});
  }

  // Passport calls this after Google redirects back
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    const user: GoogleUserProfile = {
      googleId: id,
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.[0]?.value ?? '',
      accessToken,
    };

    done(null, user);
  }
}