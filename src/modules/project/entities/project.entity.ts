import {
    Field,
    GraphQLISODateTime,
    ID,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

import {
    ProjectStatus,
    ProjectType,
    ProjectVisibility,
    ProjectLanguage
} from 'src/generated/prisma/enums';

registerEnumType(ProjectStatus, {
    name: 'ProjectStatus',
});

registerEnumType(ProjectType, {
    name: 'ProjectType',
});

registerEnumType(ProjectVisibility, {
    name: 'ProjectVisibility',
});

registerEnumType(ProjectLanguage, {
    name: 'ProjectLanguage'
})

@ObjectType()
export class ProjectEntity {
    @Field(() => ID)
    id!: string;

    @Field()
    name!: string;

    @Field(() => String, { nullable: true, defaultValue: null })
    description!: string | null;

    @Field(() => String, { nullable: true, defaultValue: null })
    coverUrl!: string | null;

    @Field(() => String, { nullable: true })
    slug!: string;

    @Field(() => ProjectType)
    type!: ProjectType;

    @Field(() => ProjectStatus)
    status!: ProjectStatus;

    @Field(() => ProjectVisibility)
    visibility!: ProjectVisibility;

    @Field(() => ProjectLanguage, { nullable: true, defaultValue: ProjectLanguage.EN })
    language!: ProjectLanguage;

    @Field(() => ID)
    ownerId!: string;

    @Field(() => GraphQLISODateTime, { nullable: true })
    publishedAt!: Date | null;

    @Field(() => GraphQLISODateTime, { nullable: true })
    archivedAt!: Date | null;

    @Field(() => GraphQLISODateTime)
    createdAt!: Date;

    @Field(() => GraphQLISODateTime)
    updatedAt!: Date;
}