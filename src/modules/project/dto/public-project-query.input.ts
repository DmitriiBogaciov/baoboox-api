import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { ProjectSortInput, PublicProjectFilterInput } from './index';
import { PaginationInput } from 'src/common/utils/dto/pagination.input';
import { Type } from 'class-transformer';

@InputType()
export class PublicProjectQueryInput {
    @Field(() => PublicProjectFilterInput, { nullable: true })
        @IsOptional()
        @ValidateNested()
        @Type(() => PublicProjectFilterInput)
        filter?: PublicProjectFilterInput;
    
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