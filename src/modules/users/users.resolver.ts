import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput, ChangeUserRoleInput, DeleteUserInput } from './dto';
import { UserDocument } from './schemas/user.schema';
import { getPermissionsByRole } from '../auth/utils/get-permissions-by-role.util';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  private toEntity(user: UserDocument): UserEntity {
    return {
      id: this.toStringId(user._id),
      firstName: user.firstName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    };
  }

  private toStringId(id: unknown): string {
    if (id instanceof Types.ObjectId) {
      return id.toString();
    }

    return String(id);
  }

  @Query(() => [UserEntity], { name: 'users' })
  async findAll(): Promise<UserEntity[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => this.toEntity(user));
  }

  @Query(() => UserEntity, { name: 'user' })
  async findById(@Args('id') id: string): Promise<UserEntity> {
    const user = await this.usersService.findById(id);
    return this.toEntity(user);
  }

  @Mutation(() => UserEntity)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<UserEntity> {
    const user = await this.usersService.create(input);
    return this.toEntity(user);
  }

  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USER_ROLE_UPDATE)
  @Mutation(() => UserEntity, { name: 'changeUserRole' })
  async changeUserRole(
    @Args('input') input: ChangeUserRoleInput,
  ): Promise<UserEntity> {
    const user = await this.usersService.changeUserRole(input);
    return this.toEntity(user);
  }

  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.USER_DELETE)
  @Mutation(() => Boolean, { name: 'deleteUser' })
  async deleteUser(
    @Args('input') input: DeleteUserInput,
  ): Promise<Boolean> {
    return await this.usersService.deleteUser(input.userId);
  }
}