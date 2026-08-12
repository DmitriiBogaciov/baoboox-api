import { InputType, Field } from '@nestjs/graphql'
import { IsOptional, ValidateNested } from 'class-validator';
import { PaginationInput, UserFilterInput, UserSortInput } from '.'
import { Type } from 'class-transformer';

@InputType()
export class UserQueryInput {
    @Field(() => UserFilterInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => UserFilterInput)
    filter?: UserFilterInput;

    @Field(() => UserSortInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => UserSortInput)
    sort?: UserSortInput;

    @Field(() => PaginationInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginationInput)
    pagination?: PaginationInput;
}
