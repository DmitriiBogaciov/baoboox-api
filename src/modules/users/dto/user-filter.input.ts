import { Field, InputType } from "@nestjs/graphql";
import { UserRole } from "../../../generated/prisma/enums";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

@InputType()
export class UserFilterInput {

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    search?: string;

    @Field(() => UserRole, { nullable: true })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}