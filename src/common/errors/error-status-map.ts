import { HttpStatus } from '@nestjs/common';

export const APP_ERROR_STATUS_MAP: Record<string, number> = {
  BAD_USER_INPUT: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  SERVICE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};