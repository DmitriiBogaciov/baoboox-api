import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ProjectType, ProjectLanguage } from 'src/generated/prisma/enums';

registerEnumType(ProjectType, { name: 'ProjectType' });
registerEnumType(ProjectLanguage, { name: 'ProjectLanguage' });

@InputType()
export class PublicProjectFilterInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @Field(() => ProjectType, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectType)
    type?: ProjectType;

    @Field(() => ProjectLanguage, { nullable: true })
    @IsOptional()
    @IsEnum(ProjectLanguage)
    language?: ProjectLanguage;
}