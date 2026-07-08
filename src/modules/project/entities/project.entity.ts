import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProjectStatus } from '../enums/project-status.enum';

registerEnumType(ProjectStatus, {
    name: 'ProjectStatus',
    description: 'The status of the project',
});

@ObjectType()
export class ProjectEntity {
    @Field(() => ID)
    id!: string;

    @Field()
    title!: string;

    @Field({ nullable: true })
    description?: string;

    @Field(() => ID)
    authorId!: string;

    @Field(() => ProjectStatus)
    status!: ProjectStatus;

    @Field()
    createdAt!: Date;

    @Field()
    updatedAt!: Date;
}