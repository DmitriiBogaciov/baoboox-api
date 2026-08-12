import {Field, InputType} from "@nestjs/graphql";
import {UserRole} from "src/generated/prisma/enums";
import { IsMongoId, IsNotEmpty } from "class-validator";

@InputType()
export class ChangeUserRoleInput {
    @Field()
    @IsNotEmpty()
    @IsMongoId()
    userId!: string;

    @Field(() => UserRole)
    @IsNotEmpty()
    newRole!: UserRole;
}
