import { Field, ObjectType, Int } from "@nestjs/graphql";
import { UserEntity } from "../entities/user.entity";

@ObjectType()
export class UsersResponse {
  @Field(() => [UserEntity])
  items!: UserEntity[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;
}