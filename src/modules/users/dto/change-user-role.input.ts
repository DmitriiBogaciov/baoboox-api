import {Field, InputType} from "@nestjs/graphql";
import {UserRole} from "../enums/user-role.enum";
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
