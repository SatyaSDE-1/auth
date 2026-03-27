// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

// Fix: define a plain profile type instead of Omit<User, 'password'>
// Omit<User, 'password'> still includes class methods (hashPassword, validatePassword)
// which a plain object destructure cannot satisfy
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  // Fix: return UserProfile instead of Omit<User, 'password'>
  async getProfile(id: string): Promise<UserProfile> {
    const user = await this.findById(id);
    const { password, hashPassword, validatePassword, ...profile } = user;
    return profile;
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.softDelete(id);
  }
}