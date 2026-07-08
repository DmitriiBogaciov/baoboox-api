import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from './entities/project.entity';
import { CreateProjectInput, UpdateProjectInput } from './dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';
import { stringify } from 'node:querystring';
import { GetPublicProjectsArgs, PaginatedProjectsResponse } from './dto/get-projects/get-publish-projects.args';

@Resolver()
export class ProjectResolver {
    constructor(
        private readonly projectService: ProjectService
    ) { }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_CREATE)
    @Mutation(() => ProjectEntity, { name: 'createProject' })
    async create(
        @CurrentUser() user: UserEntity,
        @Args('input') input: CreateProjectInput,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.create(user, input);
        return project;
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_UPDATE_OWN)
    @Mutation(() => ProjectEntity, { name: 'updateProject' })
    async update(
        @CurrentUser() user: UserEntity,
        @Args('input') input: UpdateProjectInput,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.update(user, input.id, input.data);
        return project;
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_DELETE_OWN)
    @Mutation(() => ProjectEntity, { name: 'deleteProject' })
    async delete(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.delete(user, projectId);
        return project;
    }

    @Query(() => PaginatedProjectsResponse, { name: 'getPublicProjects' })
    async getPublishedProjects(
        @Args() args: GetPublicProjectsArgs,
    ): Promise<PaginatedProjectsResponse> {
        const projects = await this.projectService.getPublicProjects(args);
        return projects;
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [ProjectEntity], { name: 'getUserProjects' })
    async getUserProjects(
        @CurrentUser() user: UserEntity
    ): Promise<ProjectEntity[]> {
        return this.projectService.getUserProjects(user.id);
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_VIEW_ANY)
    @Query(() => String, { name: 'getAllProjects' })
    async getAllProjects(): Promise<String> {
        return 'Get all projects';
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_PUBLISH)
    @Mutation(() => ProjectEntity, { name: 'publishProject' })
    async publishProject(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.publish(user, projectId);
        return project;
    }
}
