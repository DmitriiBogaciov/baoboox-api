import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateProjectDataInput } from './update-project-data.input';

@InputType()
export class UpdateProjectInput {
    @Field()
    @IsMongoId()
    @IsNotEmpty()
    id!: string;

    @Field(() => UpdateProjectDataInput)
    @ValidateNested()
    @Type(() => UpdateProjectDataInput)
    data!: UpdateProjectDataInput;
}