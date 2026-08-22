import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsEnum } from "class-validator";
import { UserSortField } from '../enums';
import { SortDirection } from "src/common/utils/sort-direction.enum";

registerEnumType(UserSortField, {
  name: 'UserSortField'
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