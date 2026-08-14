import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsEmail, MaxLength, MinLength, IsOptional } from "class-validator";

@InputType()
export class UpdateUserInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @MinLength(2)
    @MaxLength(50)
    firstName ?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @MinLength(2)
    @MaxLength(50)
    lastName ?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @MinLength(2)
    @MaxLength(50)
    username ?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    avatarUrl ?: string;
}