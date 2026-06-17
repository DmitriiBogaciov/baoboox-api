import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType()
export class AuthResponseEntity {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken?: string;

  @Field(() => UserEntity)
  user!: UserEntity;
}