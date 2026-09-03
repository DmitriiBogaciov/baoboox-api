import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ProjectEntity } from './entities/project.entity';
import { CreateProjectInput, UpdateOwnedProjectInput, ProjectQueryOutput, PublicProjectQueryInput, ProjectQueryInput } from './dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

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
    @Permissions(Permission.PROJECT_VIEW_ANY)
    @Query(() => ProjectQueryOutput, { name: 'getProjects' })
    async getProjects(
        @Args('input', {type: () => ProjectQueryInput, nullable: true}) input?: ProjectQueryInput
    ): Promise<ProjectQueryOutput> {
        const result = await this.projectService.find(input ?? {});
        return result;
    }

    @Query(() => ProjectQueryOutput, { name: 'getPublicProjects' })
    async getPublicProjects(
        @Args('input', {type: () => PublicProjectQueryInput, nullable: true}) input?: PublicProjectQueryInput    
    ): Promise<ProjectQueryOutput> {
        const result = await this.projectService.findPublic(input ?? {});
        return result;
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_UPDATE_OWN)
    @Mutation(() => ProjectEntity, { name: 'updateOwnedProject' })
    async updateOwnedProject(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
        @Args('input', { nullable: true }) input?: UpdateOwnedProjectInput,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.updateOwnedProject(user, projectId, input ?? {});
        return project;
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_SUBMIT_FOR_REVIEW)
    @Mutation(() => ProjectEntity, { name: 'submitProjectForReview' })
    async submitProjectForReview(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.submitProjectForReview(user, projectId);
        return project;
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => ProjectEntity, { name: 'archiveOwnedProject' })
    async archiveOwnedProject(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.archiveOwnedProject(user, projectId);
        return project;
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => ProjectEntity, { name: 'restoreOwnedProject' })
    async restoreOwnedProject(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.restoreOwnedProject(user, projectId);
        return project;
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_PUBLISH)
    @Mutation(() => ProjectEntity, { name: 'publishProject' })
    async publishProject(
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.publishProject(projectId);
        return project; 
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_REJECT_PUBLISH)
    @Mutation(() => ProjectEntity, { name: 'rejectPublishProject' })
    async rejectPublishProject(
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.rejectPublishProject(projectId);
        return project; 
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => ProjectEntity, { name: 'rejectOwnedPublishProject' })
    async rejectOwnedPublishProject(
        @CurrentUser() user: UserEntity,
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.rejectOwnedPublishProject(user, projectId);
        return project; 
    }
    
    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_UNPUBLISH)
    @Mutation(() => ProjectEntity, { name: 'unpublishProject' })
    async unpublishProject(
        @Args('projectId') projectId: string,
    ): Promise<ProjectEntity> {
        const project = await this.projectService.unpublishProject(projectId);
        return project;
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => [ProjectEntity], { name: 'getOwnedProjects'})
    async getOwnedProjects(
        @CurrentUser() user: UserEntity
    ): Promise<ProjectEntity[]> {
        return await this.projectService.getOwnedProjects(user);
    }

    @UseGuards(GqlAuthGuard, PermissionsGuard)
    @Permissions(Permission.PROJECT_VIEW_ANY)
    @Query(() => ProjectEntity, { name: 'getProjectById' })
    async getProjectById(
        @Args('projectId') projectId: string
    ): Promise<ProjectEntity> {
        return await this.projectService.getProjectById(projectId);
    }
}
