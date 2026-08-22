import { Field, InputType } from '@nestjs/graphql';
import { ProjectFilterInput, ProjectSortInput} from './index';
import { PaginationInput } from 'src/common/utils/dto/pagination.input';
import { ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProjectQueryInput {
    @Field(() => ProjectFilterInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectFilterInput)
    filter?: ProjectFilterInput;

    @Field(() => ProjectSortInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectSortInput)
    sort?: ProjectSortInput;

    @Field(() => PaginationInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => PaginationInput)
    pagination?: PaginationInput;
}