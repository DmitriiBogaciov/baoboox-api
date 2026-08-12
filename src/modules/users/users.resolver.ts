import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput, ChangeUserRoleInput, DeleteUserInput, UserQueryInput, UsersResponse } from './dto';
import { UserDocument } from './schemas/user.schema';
import { getPermissionsByRole } from '../auth/utils/get-permissions-by-role.util';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@Resolver(() => UserEntity)
export default class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  private toEntity(user: UserEntity): UserEntity {
    return {
      id: this.toStringId(user.id),
      firstName: user.firstName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      isActive: user.isActive
    };
  }

  private toStringId(id: unknown): string {
    if (id instanceof Types.ObjectId) {
      return id.toString();
    }

    return String(id);
  }

  @Query(() => UsersResponse, { name: 'getUsers' })
  async findAll(
    @Args('input', { nullable: true }) input?: UserQueryInput,
  ): Promise<UsersResponse> {
    return await this.usersService.findAll(input);
  }

  @Query(() => UserEntity, { name: 'getUserById' })
  async findById(@Args('id') id: string): Promise<UserEntity> {
    const user = await this.usersService.findById(id);
    return this.toEntity(user);
  }

  // @UseGuards(GqlAuthGuard, PermissionsGuard)
  // @Permissions(Permission.USER_ROLE_UPDATE)
  // @Mutation(() => UserEntity, { name: 'changeUserRole' })
  // async changeUserRole(
  //   @Args('input') input: ChangeUserRoleInput,
  // ): Promise<UserEntity> {
  //   const user = await this.usersService.changeUserRole(input);
  //   return this.toEntity(user);
  // }

  // @UseGuards(GqlAuthGuard, PermissionsGuard)
  // @Permissions(Permission.USER_DELETE)
  // @Mutation(() => Boolean, { name: 'deleteUser' })
  // async deleteUser(
  //   @Args('input') input: DeleteUserInput,
  // ): Promise<Boolean> {
  //   return await this.usersService.deleteUser(input.userId);
  // }
}