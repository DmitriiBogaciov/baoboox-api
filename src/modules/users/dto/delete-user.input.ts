import {Field, InputType} from "@nestjs/graphql";
import { IsMongoId, IsNotEmpty } from "class-validator";

@InputType()
export class DeleteUserInput {
    @Field()
    @IsNotEmpty()
    @IsMongoId()
    userId!: string;
}
