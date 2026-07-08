import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional} from 'class-validator';

@InputType()
export class UpdateProjectDataInput {
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    title?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    description?: string;
}