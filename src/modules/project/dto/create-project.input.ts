import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

import { ProjectType, ProjectVisibility, ProjectLanguage } from 'src/generated/prisma/enums';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @Length(3, 255)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 5_000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @Field(() => ProjectType, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @Field(() => ProjectVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(ProjectLanguage)
  language?: ProjectLanguage;
  
}