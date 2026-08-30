import { Injectable } from '@nestjs/common';
import { CreateProjectInput, ProjectQueryInput, ProjectQueryOutput, UpdateOwnedProjectInput } from './dto';
import { createSlug } from '../../common/utils/create-slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
    BadUserInputAppError,
    ConflictAppError,
    ForbiddenAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';
import { Prisma, Project, ProjectStatus } from 'src/generated/prisma/client';

const MAX_SLUG_ATTEMPTS = 100;
const MAX_SLUG_LENGTH = 255;

@Injectable()
export class ProjectService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async create(
        user: UserEntity,
        createProjectInput: CreateProjectInput,
    ): Promise<Project> {
        const name = createProjectInput.name.trim();
        const baseSlug = createSlug(name);

        if (!baseSlug) {
            throw new BadUserInputAppError(
                'Cannot generate slug from project name. Please provide a valid name.',
            );
        }

        for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
            const slug = this.getSlugCandidate(baseSlug, attempt);

            try {
                return await this.prismaService.project.create({
                    data: {
                        name,
                        slug,
                        description: createProjectInput.description?.trim(),
                        coverUrl: createProjectInput.coverUrl,
                        type: createProjectInput.type,
                        visibility: createProjectInput.visibility,
                        language: createProjectInput.language,
                        ownerId: user.id,
                    },
                });
            } catch (error) {
                if (this.isSlugConflict(error)) {
                    continue;
                }

                throw error;
            }
        }

        throw new ConflictAppError(
            'Cannot generate unique slug for project after multiple attempts',
        );
    }

    async find(input: ProjectQueryInput): Promise<ProjectQueryOutput> {

        const page = input?.pagination?.page ?? 1;
        const limit = input?.pagination?.limit ?? 20;
        const skip = (page - 1) * limit;

        const search = input?.filter?.search?.trim();

        const where: Prisma.ProjectWhereInput = {};

        if (input?.filter?.search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    slug: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
            ]
        };

        if (input?.filter?.status) {
            where.status = input.filter.status;
        }

        if (input?.filter?.type) {
            where.type = input.filter.type;
        }

        if (input?.filter?.visibility) {
            where.visibility = input.filter.visibility;
        }

        if (input?.filter?.language) {
            where.language = input.filter.language;
        }

        const sortField = input?.sort?.field ?? 'createdAt';
        const sortDirection = input?.sort?.direction ?? 'desc';

        const [projects, total] = await this.prismaService.$transaction([
            this.prismaService.project.findMany({
                where,
                orderBy: {
                    [sortField]: sortDirection,
                },
                skip,
                take: limit,
            }),
            this.prismaService.project.count({ where }),
        ]);

        return {
            items: projects,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        };
    };

    async updateOwnedProject(
        user: UserEntity,
        projectId: string,
        updateProjectInput: UpdateOwnedProjectInput,
    ): Promise<ProjectEntity> {
        const baseSlug = updateProjectInput.name
            ? createSlug(updateProjectInput.name.trim())
            : null;

        for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
            const slug = baseSlug
                ? this.getSlugCandidate(baseSlug, attempt)
                : undefined;

            try {
                return await this.prismaService.project.update({
                    where: {
                        id: projectId,
                        ownerId: user.id,
                    },
                    data: {
                        ...updateProjectInput,
                        ...(slug && { slug }),
                    },
                });
            } catch (error) {
                if (this.isSlugConflict(error)) {
                    continue;
                }

                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2025'
                ) {
                    throw new NotFoundAppError('Project not found');
                }

                throw error;
            }
        }

        throw new ConflictAppError(
            'Could not generate a unique project slug',
        );
    }

    async submitProjectForReview(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId,
                    ownerId: user.id,
                },
                data: {
                    status: ProjectStatus.IN_REVIEW,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundAppError('Project not found');        
            }

            throw error;
        }
    }

    async ArchiveOwnedProject(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId,
                    ownerId: user.id,
                },
                data: {
                    status: ProjectStatus.ARCHIVED,
                    archivedAt: new Date(),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundAppError('Project not found');
            }

            throw error;
        }
    }

    private getSlugCandidate(
        baseSlug: string,
        attempt: number,
    ): string {
        if (attempt === 1) {
            return baseSlug;
        }

        const suffix = `-${attempt}`;

        return `${baseSlug.slice(
            0,
            MAX_SLUG_LENGTH - suffix.length,
        )}${suffix}`;
    }

    private isSlugConflict(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        );
    }
    // async getPublicProjects(
    //     args: GetPublicProjectsArgs,
    // ): Promise<PaginatedProjectsResponse> {
    //     const page = Math.max(1, args.page ?? 1);
    //     const limit = Math.min(50, Math.max(1, args.limit ?? 12));
    //     const skip = (page - 1) * limit;

    //     const filter: any = {
    //         status: ProjectStatus.PUBLISHED,
    //     };

    //     if (args.authorId) {
    //         filter.authorId = args.authorId;
    //     }

    //     // if (args.category?.trim()) {
    //     //     filter.category = args.category.trim();
    //     // }

    //     // if (args.tags?.length) {
    //     //     filter.tags = { $in: args.tags };
    //     // }

    //     const projection: Record<string, unknown> = {};

    //     let sort: Record<string, 1 | -1 | { $meta: 'textScore' }> = {
    //         publishedAt: -1,
    //         _id: -1,
    //     };

    //     if (args.search?.trim()) {
    //         filter.$text = { $search: args.search.trim() };
    //         projection.score = { $meta: 'textScore' };
    //         sort = {
    //             score: { $meta: 'textScore' },
    //             publishedAt: -1,
    //             _id: -1,
    //         };
    //     }

    //     const [projects, total] = await Promise.all([
    //         this.projectModel
    //             .find(filter, projection)
    //             .sort(sort)
    //             .skip(skip)
    //             .limit(limit)
    //             .lean()
    //             .exec(),
    //         this.projectModel.countDocuments(filter).exec(),
    //     ]);

    //     return {
    //         items: projects.map((project) => this.toEntity(project)),
    //         meta: {
    //             page,
    //             limit,
    //             total,
    //             totalPages: Math.ceil(total / limit),
    //             hasNextPage: page * limit < total,
    //             hasPrevPage: page > 1,
    //         },
    //     };
    // }

    // async getUserProjects(userId: string): Promise<ProjectEntity[]> {
    //     const projects = await this.projectModel
    //         .find({ authorId: userId })
    //         .exec();
    //     return projects.map(this.toEntity);
    // }

    // async getAllProjects(): Promise<ProjectEntity[]> {
    //     const projects = await this.projectModel.find().exec();
    //     return projects.map(this.toEntity);
    // }

    // private escapeRegex(value: string): string {
    //     return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // }

    // async publish(user: UserEntity, projectId: string): Promise<ProjectEntity> {
    //     const project = await this.projectModel.findById(projectId).exec();
    //     if (!project) throw new NotFoundAppError('Project not found')

    //     project.status = ProjectStatus.PUBLISHED;
    //     await project.save();

    //     return this.toEntity(project);
    // }

    // private toEntity(doc: ProjectDocument): ProjectEntity {
    //     return {
    //         id: doc._id.toString(),
    //         title: doc.title,
    //         description: doc.description,
    //         authorId: doc.authorId.toString(),
    //         status: doc.status,
    //         createdAt: (doc as any).createdAt,
    //         updatedAt: (doc as any).updatedAt,
    //     };
    // }
}
