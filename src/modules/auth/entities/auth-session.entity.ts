import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthSessionEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  userId!: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ip?: string;

  @Field()
  isRevoked!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field({ nullable: true })
  lastUsedAt?: Date;
}