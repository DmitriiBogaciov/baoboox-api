export enum Permission {
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE_OWN = 'project:update:own',
  PROJECT_UPDATE_ANY = 'project:update:any',
  PROJECT_DELETE_OWN = 'project:delete:own',
  PROJECT_DELETE_ANY = 'project:delete:any',
  PROJECT_PUBLISH = 'project:publish',
  PROJECT_VIEW_ANY = 'project:view:any',
  PROJECT_SUBMIT_FOR_REVIEW = 'project:submit-for-review',

  COMMENT_CREATE = 'comment:create',
  COMMENT_DELETE_OWN = 'comment:delete:own',
  COMMENT_MODERATE = 'comment:moderate',

  BOOKMARK_CREATE = 'bookmark:create',

  REPORT_CREATE = 'report:create',
  REPORT_REVIEW = 'report:review',

  CONTENT_HIDE = 'content:hide',

  USER_ROLE_UPDATE = 'user:role:update',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  ADMIN_ACCESS = 'admin:access',
}