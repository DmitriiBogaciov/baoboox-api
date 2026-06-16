import {Field, InputType} from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
    @Field()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;

    @Field()
    @IsEmail()
    email!: string;
} 