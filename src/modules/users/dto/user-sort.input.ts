import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsEnum } from "class-validator";
import { UserSortField, SortDirection } from '../enums'

registerEnumType(UserSortField, {
  name: 'UserSortField'
})

registerEnumType(SortDirection, {
  name: 'SortDirection'
})

@InputType()
export class UserSortInput {
  @Field(() => UserSortField, {
    defaultValue: UserSortField.CREATED_AT,
  })
  @IsEnum(UserSortField)
  field: UserSortField = UserSortField.CREATED_AT;

  @Field(() => SortDirection, {
    defaultValue: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.DESC;
}