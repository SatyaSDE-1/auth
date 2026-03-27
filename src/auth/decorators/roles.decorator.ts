// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.ADMIN, Role.SUPER_ADMIN)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);