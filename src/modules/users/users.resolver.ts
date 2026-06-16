import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UserDocument } from './schemas/user.schema';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  private toEntity(user: UserDocument): UserEntity {
    return {
      id: this.toStringId(user._id),
      firstName: user.firstName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
}