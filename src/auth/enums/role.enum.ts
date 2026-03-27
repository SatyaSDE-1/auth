// src/auth/enums/role.enum.ts
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

// Role hierarchy — higher index = more permissions
export const ROLE_HIERARCHY: Role[] = [
  Role.USER,
  Role.MODERATOR,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

// Get numeric level of a role (higher = more powerful)
export const getRoleLevel = (role: Role): number => {
  return ROLE_HIERARCHY.indexOf(role);
};

// Check if a role has at least the required level
export const hasRoleLevel = (userRole: Role, requiredRole: Role): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};