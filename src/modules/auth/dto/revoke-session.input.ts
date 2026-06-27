import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId } from 'class-validator';

@InputType()
export class RevokeSessionInput {
  @Field()
  @IsMongoId()
  sessionId!: string;
}