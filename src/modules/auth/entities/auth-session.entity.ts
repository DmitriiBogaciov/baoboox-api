import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthSessionEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  userId!: string;

  @Field(() => String, { nullable: true })
  userAgent?: string | null;

  @Field(() => String, { nullable: true })
  ip?: string | null;

  @Field()
  isRevoked!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  lastUsedAt?: Date | null;
}