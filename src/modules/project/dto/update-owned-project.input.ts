import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsUrl, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectLanguage, ProjectType, ProjectVisibility } from 'src/generated/prisma/browser';

@InputType()
export class UpdateOwnedProjectInput {
    @Field(() => String, { nullable: true })
    @IsString()
    @Length(3, 255)
    @Type(() => String)
    @IsOptional()
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Length(1, 5_000)
    @Type(() => String)
    description?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUrl()
    @Type(() => String)
    coverUrl?: string;

    @Field(() => ProjectType, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectType)
    type?: ProjectType;

    @Field(() => ProjectVisibility, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectVisibility)
    visibility?: ProjectVisibility;

    @Field(() => ProjectLanguage, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectLanguage)
    language?: ProjectLanguage
}