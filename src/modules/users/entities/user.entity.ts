import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../generated/prisma/enums';
import { Permission } from '../../auth/enums/permissions.enum';

registerEnumType(UserRole, {
    name: 'UserRole'
});

registerEnumType(Permission, {
    name: 'Permissson'
})

@ObjectType()
export class UserEntity {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field()
  email!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => Boolean)
  isActive!: boolean

  @Field(() => [Permission], { nullable: true })
  permissions?: Permission[] | null;
}