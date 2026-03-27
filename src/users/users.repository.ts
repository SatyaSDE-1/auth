// src/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

export interface CreateOAuthUserDto {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: AuthProvider;
  providerId: string;
}

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create({ ...dto, provider: AuthProvider.LOCAL });
    return this.repo.save(user);
  }

  async createOAuthUser(dto: CreateOAuthUserDto): Promise<User> {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByProviderId(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.repo.findOne({ where: { provider, providerId } });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email } });
    return count > 0;
  }

  async updateById(id: string, data: Partial<User>): Promise<void> {
    await this.repo.update({ id }, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.update({ id }, { isActive: false });
  }
}