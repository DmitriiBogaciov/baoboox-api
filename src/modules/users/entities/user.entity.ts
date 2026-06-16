import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserEntity {
    @Field(() => ID)
    id!: string;

    @Field()
    firstName?: string;

    @Field() 
    email!: string;

    @Field()
    createdAt!: Date;

    @Field()
    updatedAt!: Date; 
}