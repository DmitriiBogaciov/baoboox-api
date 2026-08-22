import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { ProjectSortField } from '../enums';
import { SortDirection } from 'src/common/utils/sort-direction.enum';

registerEnumType(ProjectSortField, {
    name: 'ProjectSortField',
})

@InputType()
export class ProjectSortInput {
    @Field(() => ProjectSortField, {
        defaultValue: ProjectSortField.CREATED_AT,
    })
    @IsEnum(ProjectSortField)
    field: ProjectSortField = ProjectSortField.CREATED_AT;

    @Field(() => SortDirection, {
        defaultValue: SortDirection.DESC,
    })
    @IsEnum(SortDirection)
    direction: SortDirection = SortDirection.DESC;
}