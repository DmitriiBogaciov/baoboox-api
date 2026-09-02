import { Permission } from '../enums/permissions.enum';
import { UserRole } from '../../../generated/prisma/enums';

const READER_PERMISSIONS: Permission[] = [
  Permission.COMMENT_CREATE,
  Permission.COMMENT_DELETE_OWN,
  Permission.BOOKMARK_CREATE,
  Permission.REPORT_CREATE,
];

const AUTHOR_PERMISSIONS: Permission[] = [
  ...READER_PERMISSIONS,
  Permission.PROJECT_CREATE,
  Permission.PROJECT_UPDATE_OWN,
  Permission.PROJECT_DELETE_OWN,
  Permission.PROJECT_SUBMIT_FOR_REVIEW,
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...AUTHOR_PERMISSIONS,
  Permission.COMMENT_MODERATE,
  Permission.REPORT_REVIEW,
  Permission.CONTENT_HIDE,
  Permission.PROJECT_PUBLISH,
  Permission.USER_UPDATE,
  Permission.PROJECT_REJECT_PUBLISH,
  Permission.PROJECT_UNPUBLISH,
];

export const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  [UserRole.READER]: READER_PERMISSIONS,
  [UserRole.AUTHOR]: AUTHOR_PERMISSIONS,
  [UserRole.MODERATOR]: MODERATOR_PERMISSIONS,
  [UserRole.ADMIN]: Object.values(Permission),
};