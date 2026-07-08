import { Permission } from '../enums/permissions.enum';
import { ROLE_PERMISSIONS_MAP } from '../constants/role-permissions.map';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export function getPermissionsByRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS_MAP[role] ?? [];
}