import { Permission } from '../enums/permissions.enum';
import { UserRole } from 'src/generated/prisma/enums';

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}