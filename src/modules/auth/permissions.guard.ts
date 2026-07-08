import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { Permission } from './enums/permissions.enum';
import { AuthUser } from './types/auth-user.type';
import { ForbiddenAppError } from 'src/common/errors';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const req = gqlContext.getContext().req;
    const user = req.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenAppError('User not found in request');
    }

    const userPermissions = user.permissions ?? [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenAppError('Insufficient permissions');
    }

    return true;
  }
}