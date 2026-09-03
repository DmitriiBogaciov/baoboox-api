import { Injectable } from '@nestjs/common';
import { CreateProjectInput, ProjectQueryInput, PublicProjectQueryInput, ProjectQueryOutput, UpdateOwnedProjectInput } from './dto';
import { createSlug } from '../../common/utils/create-slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
    BadUserInputAppError,
    ConflictAppError,
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

    async getOwnedProjects(user: UserEntity): Promise<ProjectEntity[]> {
        try {
            return await this.prismaService.project.findMany({
                where: {
                    ownerId: user.id,
                }
            })
        } catch (error) {
            throw new ServiceUnavailableAppError('Failed to retrieve owned projects');
        }
    }

    async getProjectById(projectId: string): Promise<ProjectEntity> {
        try {
            const project = await this.prismaService.project.findUnique({
                where: {
                    id: projectId
                }
            })
            if (!project) {
                throw new NotFoundAppError('Project not found');
            }
            return project;
        } catch (error) {
            throw new ServiceUnavailableAppError('Failed to retrieve project');
        }
    }

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
            return await this.prismaService.$transaction(async (prisma) => {
                const project = await prisma.project.update({
                    where: {
                        id: projectId,
                        ownerId: user.id,
                    },
                    data: {
                        status: ProjectStatus.IN_REVIEW,
                    },
                });

                await prisma.projectModerationLog.create({
                    data: {
                        projectId: project.id,
                        actorId: user.id,
                        action: 'SUBMITTED',
                        previousStatus: ProjectStatus.DRAFT,
                        nextStatus: ProjectStatus.IN_REVIEW,
                    },
                });
                return project;
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

    async archiveOwnedProject(user: UserEntity, projectId: string): Promise<ProjectEntity> {
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

    async restoreOwnedProject(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId,
                    ownerId: user.id,
                },
                data: {
                    status: ProjectStatus.DRAFT,
                    archivedAt: null,
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

    async findPublic(input: PublicProjectQueryInput): Promise<ProjectQueryOutput> {
        const page = input?.pagination?.page ?? 1;
        const limit = input?.pagination?.limit ?? 20;
        const skip = (page - 1) * limit;

        const search = input?.filter?.search?.trim();

        const where: Prisma.ProjectWhereInput = {
            status: ProjectStatus.PUBLISHED,
            visibility: 'PUBLIC',
        };

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

        if (input?.filter?.type) {
            where.type = input.filter.type;
        }

        if (input?.filter?.language) {
            where.language = input.filter.language;
        }

        const sortField = input?.sort?.field ?? 'createdAt';
        const sortDirection = input?.sort?.direction ?? 'desc';

        const [projects, total] = await this.prismaService.$transaction([
            this.prismaService.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortField]: sortDirection,
                },
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
    }

    async publishProject(projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId
                },
                data: {
                    status: ProjectStatus.PUBLISHED,
                    visibility: 'PUBLIC',
                    publishedAt: new Date(),
                }
            })
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

    async unpublishProject(projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId
                },
                data: {
                    status: ProjectStatus.DRAFT,
                    visibility: 'PRIVATE',
                }
            })
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

    async rejectPublishProject(projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId
                },
                data: {
                    status: ProjectStatus.DRAFT,
                    visibility: 'PRIVATE',
                }
            })
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

    async rejectOwnedPublishProject(user: UserEntity, projectId: string): Promise<ProjectEntity> {
        try {
            return await this.prismaService.project.update({
                where: {
                    id: projectId,
                    ownerId: user.id,
                },
                data: {
                    status: ProjectStatus.DRAFT,
                    visibility: 'PRIVATE',
                }
            })
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
}
