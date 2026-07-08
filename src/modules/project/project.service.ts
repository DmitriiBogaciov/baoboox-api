import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {  Model } from 'mongoose';
import { CreateProjectInput, UpdateProjectDataInput } from './dto';
import { Project, ProjectDocument } from './schemas/project.schema';
import { Permission } from 'src/modules/auth/enums/permissions.enum';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity } from '../users/entities/user.entity';
import { GetPublicProjectsArgs, PaginatedProjectsResponse, ProjectSortBy, SortOrder } from './dto/get-projects/get-publish-projects.args';
import { ProjectStatus } from './enums/project-status.enum';
import {
    ForbiddenAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';

@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project.name)
        private readonly projectModel: Model<ProjectDocument>,
    ) { }

    async create(user: UserEntity, createProjectInput: CreateProjectInput): Promise<ProjectEntity> {
        try {
            console.log('Creating project for user:', user.id, 'with input:', createProjectInput);
            const project = await this.projectModel.create({
                ...createProjectInput,
                authorId: user.id,
            });
            console.log('Project created:', project);
            return this.toEntity(project);
        } catch (error) {
            console.error('Error creating project:', error);
            throw new ServiceUnavailableAppError();
        }
    }

    async update(user: UserEntity, projectId: string, updateProjectInput: UpdateProjectDataInput): Promise<ProjectEntity> {
        const project = await this.projectModel.findById(projectId).exec();

        if (!project) {
            throw new NotFoundAppError('Project not found');
        }

        const canUpdateAny = user.permissions?.includes(Permission.PROJECT_UPDATE_ANY);
        if (!canUpdateAny && project.authorId.toString() !== user.id) {
            throw new ForbiddenAppError('You can only update your own projects');
        }

        Object.assign(project, updateProjectInput);
        await project.save();

        return this.toEntity(project);
    }

    async delete(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        const project = await this.projectModel.findById(projectId);
        if (!project) throw new NotFoundAppError('Project not found');

        const canDeleteAny = user.permissions?.includes(Permission.PROJECT_DELETE_ANY);
        if (!canDeleteAny && project.authorId.toString() !== user.id) {
            throw new ForbiddenAppError('You can only delete your own projects');
        }

        await project.deleteOne();
        return this.toEntity(project);
    }

    async getPublicProjects(
        args: GetPublicProjectsArgs,
    ): Promise<PaginatedProjectsResponse> {
        const page = Math.max(1, args.page ?? 1);
        const limit = Math.min(50, Math.max(1, args.limit ?? 12));
        const skip = (page - 1) * limit;

        const filter: any = {
            status: ProjectStatus.PUBLISHED,
        };

        if (args.authorId) {
            filter.authorId = args.authorId;
        }

        // if (args.category?.trim()) {
        //     filter.category = args.category.trim();
        // }

        // if (args.tags?.length) {
        //     filter.tags = { $in: args.tags };
        // }

        const projection: Record<string, unknown> = {};

        let sort: Record<string, 1 | -1 | { $meta: 'textScore' }> = {
            publishedAt: -1,
            _id: -1,
        };

        if (args.search?.trim()) {
            filter.$text = { $search: args.search.trim() };
            projection.score = { $meta: 'textScore' };
            sort = {
                score: { $meta: 'textScore' },
                publishedAt: -1,
                _id: -1,
            };
        }

        const [projects, total] = await Promise.all([
            this.projectModel
                .find(filter, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.projectModel.countDocuments(filter).exec(),
        ]);

        return {
            items: projects.map((project) => this.toEntity(project)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        };
    }

    async getUserProjects(userId: string): Promise<ProjectEntity[]> {
        const projects = await this.projectModel
            .find({ authorId: userId })
            .exec();
        return projects.map(this.toEntity);
    }

    async getAllProjects(): Promise<ProjectEntity[]> {
        const projects = await this.projectModel.find().exec();
        return projects.map(this.toEntity);
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async publish(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        const project = await this.projectModel.findById(projectId).exec();
        if (!project) throw new NotFoundAppError('Project not found')

        project.status = ProjectStatus.PUBLISHED;
        await project.save();

        return this.toEntity(project);
    }

    private toEntity(doc: ProjectDocument): ProjectEntity {
        return {
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description,
            authorId: doc.authorId.toString(),
            status: doc.status,
            createdAt: (doc as any).createdAt,
            updatedAt: (doc as any).updatedAt,
        };
    }
}
