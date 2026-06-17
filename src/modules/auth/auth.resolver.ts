import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponseEntity } from './entities/auth-response.entity';
import { UserEntity } from '../users/entities/user.entity';
import { GqlAuthGuard } from './gql-auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './utils/refresh-cookie.util';
import { REFRESH_TOKEN_COOKIE_NAME } from './constants/auth-cookie.constant';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponseEntity)
  async register(
    @Args('input') input: RegisterInput,
    @Context() ctx: any,
  ): Promise<AuthResponseEntity> {
    const result: any = await this.authService.register(input);

    setRefreshTokenCookie(ctx.res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => AuthResponseEntity)
  async login(
    @Args('input') input: LoginInput,
    @Context() ctx: any,
  ): Promise<AuthResponseEntity> {
    const result: any = await this.authService.login(input);

    setRefreshTokenCookie(ctx.res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => AuthResponseEntity)
  async refresh(@Context() ctx: any): Promise<AuthResponseEntity> {
    const refreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result: any = await this.authService.refresh(refreshToken);

    setRefreshTokenCookie(ctx.res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: any): Promise<boolean> {
    const refreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(ctx.res);

    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity)
  async me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return user;
  }
}