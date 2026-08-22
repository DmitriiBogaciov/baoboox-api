import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ProjectStatus, ProjectType, ProjectVisibility, ProjectLanguage } from 'src/generated/prisma/enums';

registerEnumType(ProjectStatus, { name: 'ProjectStatus' });
registerEnumType(ProjectType, { name: 'ProjectType' });
registerEnumType(ProjectVisibility, { name: 'ProjectVisibility' });
registerEnumType(ProjectLanguage, { name: 'ProjectLanguage' });

@InputType()
export class ProjectFilterInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @Field(() => ProjectStatus, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

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
    language?: ProjectLanguage;
}



