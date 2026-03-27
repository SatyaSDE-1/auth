// src/auth/auth.service.ts
import {
  Injectable, ConflictException,
  UnauthorizedException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleUserProfile } from './dto/google-auth.dto';
import { RedisService } from '../redis/redis.service';
import { UsersRepository } from '../users/users.repository';
import { AuthProvider } from '../users/entities/user.entity';
import { Role } from './enums/role.enum';
import { StringValue } from 'ms';
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

async register(dto: RegisterDto): Promise<TokenPair> {
  const emailExists = await this.usersRepository.emailExists(dto.email);
  if (emailExists) throw new ConflictException('Email already registered');
  const user = await this.usersRepository.create(dto);
  return this.generateAndStoreTokens(user.id, user.email, user.role);
}

async login(dto: LoginDto): Promise<TokenPair> {
  const user = await this.usersRepository.findByEmail(dto.email);
  if (!user) {
  throw new UnauthorizedException('User not found after Google login');
}
  // if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
  if (user.provider !== AuthProvider.LOCAL)
    throw new UnauthorizedException(`Please login with ${user.provider}`);
  const isPasswordValid = await user.validatePassword(dto.password);
  if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');
  // return this.generateAndStoreTokens(user.id, user.email, user.role);
  return this.generateAndStoreTokens(user.id, user.email, user.role);
}

async googleLogin(googleUser: GoogleUserProfile): Promise<TokenPair> {
  let user = await this.usersRepository.findByProviderId(AuthProvider.GOOGLE, googleUser.googleId);
  if (!user) {
    const existingUser = await this.usersRepository.findByEmail(googleUser.email);
    if (existingUser) {
    await this.usersRepository.updateById(existingUser.id, {
  provider: AuthProvider.GOOGLE,
  providerId: googleUser.googleId,
  avatar: googleUser.avatar,
});

user = await this.usersRepository.findById(existingUser.id); // ✅ safe
    } else {
      user = await this.usersRepository.createOAuthUser({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatar: googleUser.avatar,
        provider: AuthProvider.GOOGLE,
        providerId: googleUser.googleId,
      });
    }
  }
  if (!user) {
  throw new UnauthorizedException('User not found after Google login');
}
return this.generateAndStoreTokens(user.id, user.email, user.role);

}

async refresh(userId: string, oldJti: string, email: string, role: Role): Promise<TokenPair> {
  await this.redisService.revokeRefreshToken(userId, oldJti);
  return this.generateAndStoreTokens(userId, email, role);
}


  async logout(userId: string, jti: string, accessTokenExp: number): Promise<void> {
    await this.redisService.revokeRefreshToken(userId, jti);
    const remainingTtl = accessTokenExp - Math.floor(Date.now() / 1000);
    if (remainingTtl > 0) await this.redisService.blacklistAccessToken(jti, remainingTtl);
    this.logger.log(`User logged out: ${userId}`);
  }

  async logoutAll(userId: string, jti: string, accessTokenExp: number): Promise<void> {
    await this.redisService.revokeAllRefreshTokens(userId);
    const remainingTtl = accessTokenExp - Math.floor(Date.now() / 1000);
    if (remainingTtl > 0) await this.redisService.blacklistAccessToken(jti, remainingTtl);
    this.logger.log(`User logged out from all devices: ${userId}`);
  }

private async generateAndStoreTokens(userId: string, email: string, role: Role): Promise<TokenPair> {
  const accessJti = uuidv4();
  const refreshJti = uuidv4();

  const [accessToken, refreshToken] = await Promise.all([
    this.signAccessToken(userId, email, role, accessJti),
    this.signRefreshToken(userId, email, refreshJti),
  ]);

 const refreshTtl = this.configService.getOrThrow<number>('jwt.refreshExpiresInSeconds');
  await this.redisService.storeRefreshToken(userId, refreshJti, refreshTtl);

  return { accessToken, refreshToken };
}

private signAccessToken(
  userId: string,
  email: string,
  role: Role,
  jti: string,
): Promise<string> {
  return this.jwtService.signAsync(
    { sub: userId, email, role, jti },
    {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>('jwt.accessExpiresIn'), // ✅ FIX
    },
  );
}

private signRefreshToken(
  userId: string,
  email: string,
  jti: string,
): Promise<string> {
  return this.jwtService.signAsync(
    { sub: userId, email, jti },
    {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>('jwt.refreshExpiresIn'), // ✅ FIX
    },
  );
}

}

