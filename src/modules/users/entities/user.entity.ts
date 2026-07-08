import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '../enums/user-role.enum';
import { Permission } from '../../auth/enums/permissions.enum';

@ObjectType()
export class UserEntity {
    @Field(() => ID)
    id!: string;

    @Field({ nullable: true })
    firstName?: string;

    @Field() 
    email!: string;

    @Field()
    createdAt!: Date;

    @Field()
    updatedAt!: Date; 

    @Field(() => UserRole)
    role!: UserRole;

    @Field(() => [Permission] , { nullable: true })
    permissions?: Permission[];
}