import { Permission } from '../enums/permissions.enum';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}