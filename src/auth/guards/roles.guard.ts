// src/auth/guards/roles.guard.ts
import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, hasRoleLevel } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new ForbiddenException('No user found in request');
    if (!user.role) throw new ForbiddenException('User has no role assigned');

    // Check if user's role satisfies ANY of the required roles (using hierarchy)
    const hasPermission = requiredRoles.some((requiredRole) =>
      hasRoleLevel(user.role, requiredRole),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your role: ${user.role}`,
      );
    }

    return true;
  }
}