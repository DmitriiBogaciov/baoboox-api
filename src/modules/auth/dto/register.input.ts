import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
    @Field({ nullable: true })
    @IsOptional()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;

    @Field()
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty()
    email!: string;

    @Field()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(50)
    password!: string;
} 