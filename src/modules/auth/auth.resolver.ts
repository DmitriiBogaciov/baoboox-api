import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UnauthorizedAppError } from 'src/common/errors';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { RevokeSessionInput } from './dto/revoke-session.input';
import { AuthResponseEntity } from './entities/auth-response.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { UserEntity } from '../users/entities/user.entity';
import { GqlAuthGuard } from './gql-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './utils/refresh-cookie.util';
import { REFRESH_TOKEN_COOKIE_NAME } from './constants/auth-cookie.constant';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  private getSessionMeta(req: Request) {
    return {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }

  @Mutation(() => AuthResponseEntity)
  async register(
    @Args('input') input: RegisterInput,
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<AuthResponseEntity> {
    const result: AuthResponseEntity = await this.authService.register(input, this.getSessionMeta(req));
    const refreshToken = result.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedAppError('Refresh token not generated');
    }

    setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => AuthResponseEntity)
  async login(
    @Args('input') input: LoginInput,
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<AuthResponseEntity> {
    const result = await this.authService.login(input, this.getSessionMeta(req));

    const refreshToken = result.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedAppError('Refresh token not generated');
    }

    setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => AuthResponseEntity)
  async refresh(
    @Context('req') req: Request,
    @Context('res') res: Response
  ): Promise<AuthResponseEntity> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedAppError('Refresh token not found');
    }

    const result: any = await this.authService.refresh(refreshToken, this.getSessionMeta(req));

    const newRefreshToken = result.refreshToken;

    if (!newRefreshToken) {
      throw new UnauthorizedAppError('Refresh token not generated');
    }

    setRefreshTokenCookie(res, newRefreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => Boolean)
  async logout(
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<boolean> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(res);

    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity)
  async me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return user;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [AuthSessionEntity])
  async mySessions(@CurrentUser() user: UserEntity): Promise<AuthSessionEntity[]> {
    return this.authService.getMySessions(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async revokeSession(
    @CurrentUser() user: UserEntity,
    @Args('input') input: RevokeSessionInput,
  ): Promise<boolean> {
    return this.authService.revokeSession(user.id, input.sessionId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Number, { name: 'logoutAll'})
  async logoutAll(
    @CurrentUser() user: UserEntity,
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<number> {
    const result = await this.authService.logoutAll(user.id);
    clearRefreshTokenCookie(res);
    return result;
  }

  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN_ACCESS)
  @Mutation(() => Number, { name: 'deleteExpiredSessions'})
  async deleteExpiredSessions (): Promise<number>{
    const count = await this.authService.deleteExpiredSessions()
    return count;
  }
}