import {Field, InputType} from "@nestjs/graphql";
import {UserRole} from "src/generated/prisma/enums";
import { IsNotEmpty } from "class-validator";

@InputType()
export class ChangeUserRoleInput {
    @Field()
    @IsNotEmpty()
    userId!: string;

    @Field(() => UserRole)
    @IsNotEmpty()
    newRole!: UserRole;
}
