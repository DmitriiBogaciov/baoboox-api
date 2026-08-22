import { ProjectEntity } from '../entities/project.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProjectQueryOutput {
    @Field(() => [ProjectEntity])
    items!: ProjectEntity[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    limit!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field(() => Boolean)
    hasNextPage!: boolean;

    @Field(() => Boolean)
    hasPrevPage!: boolean;
}