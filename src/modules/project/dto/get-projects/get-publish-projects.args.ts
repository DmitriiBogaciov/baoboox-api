import { ArgsType, Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsOptional, Min, Max, IsInt, IsString, IsArray, ArrayMaxSize, IsMongoId, IsEnum,  } from 'class-validator';
import { ProjectEntity } from '../../entities/project.entity';
import { Type } from 'class-transformer';

export enum ProjectSortBy {
    PUBLISHED_AT = 'publishedAt',
    CREATED_AT = 'createdAt',
    TITLE = 'title',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

registerEnumType(ProjectSortBy, { name: 'ProjectSortBy' });
registerEnumType(SortOrder, { name: 'SortOrder' });

@ArgsType()
export class GetPublicProjectsArgs {
    @Field(() => Int, { nullable: true, defaultValue: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @Field(() => Int, { nullable: true, defaultValue: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 12;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    search?: string;

    @Field(() => ProjectSortBy, {
        nullable: true,
        defaultValue: ProjectSortBy.PUBLISHED_AT,
    })
    @IsOptional()
    @IsEnum(ProjectSortBy)
    sortBy?: ProjectSortBy = ProjectSortBy.PUBLISHED_AT;

    @Field(() => SortOrder, {
        nullable: true,
        defaultValue: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

    @Field({ nullable: true })
    @IsOptional()
    @IsMongoId()
    authorId?: string;

    // @Field({ nullable: true })
    // @IsOptional()
    // @IsString()
    // category?: string;

    // @Field(() => [String], { nullable: true })
    // @IsOptional()
    // @IsArray()
    // @ArrayMaxSize(20)
    // @IsString({ each: true })
    // tags?: string[];
}

@ObjectType()
export class PaginationMeta {
    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    limit!: number;

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field()
    hasNextPage!: boolean;

    @Field()
    hasPrevPage!: boolean;
}

@ObjectType()
export class PaginatedProjectsResponse {
    @Field(() => [ProjectEntity])
    items!: ProjectEntity[];

    @Field(() => PaginationMeta)
    meta!: PaginationMeta;
}