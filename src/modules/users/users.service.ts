import { Injectable } from '@nestjs/common';
import { ChangeUserRoleInput, UserQueryInput, UsersResponse, UpdateUserInput } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import {
    ConflictAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';
import { UserEntity } from './entities/user.entity';
import { SortDirection, UserSortField } from './enums';

@Injectable()
export class UsersService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async find(query?: UserQueryInput): Promise<UsersResponse>  {
        const page = query?.pagination?.page ?? 1;
        const limit = query?.pagination?.limit ?? 20;

        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {}

        if (query?.filter?.search) {
            where.OR = [
                {
                    id: {
                        contains: query.filter.search,
                        mode: 'insensitive'
                    }
                },
                {
                    email: {
                        contains: query.filter.search,
                        mode: 'insensitive'
                    }
                },
                {
                    username: {
                        contains: query.filter.search,
                        mode: 'insensitive'
                    }
                },
                {
                    firstName: {
                        contains: query.filter.search,
                        mode: 'insensitive'
                    }
                },
                {
                    lastName: {
                        contains: query.filter.search,
                        mode: 'insensitive'
                    }
                },
            ]
        }

        if (query?.filter?.role) {
            where.role = query.filter.role;
        }

        if (query?.filter?.isActive != undefined) {
            where.isActive = query.filter.isActive
        }

        const sortField = query?.sort?.field ?? UserSortField.CREATED_AT;

        const sortDirection = query?.sort?.direction ?? SortDirection.DESC;

        const [users, total] = await this.prismaService.$transaction([
            this.prismaService.user.findMany({
                where,
                orderBy: {
                    [sortField]: sortDirection
                },
                skip,
                take: limit,
            }),

            this.prismaService.user.count({
                where
            })
        ])

        return {
            items: users.map((user) => this.toUserEntity(user)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        };
    }

    async findById(id: string): Promise<UserEntity> {
        const user = await this.prismaService.user.findFirst({
            where: {
                id
            }
        })
        if (!user) {
            throw new NotFoundAppError('User not found');
        }
        return this.toUserEntity(user);
    }

    async changeUserRole(input: ChangeUserRoleInput): Promise<UserEntity> {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: input.userId
            }
        })

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        try {
            const updatedUser = await this.prismaService.user.update({
                where: {
                    id: input.userId
                },
                data: {
                    role: input.newRole
                }
            })
            return this.toUserEntity(updatedUser);
        } catch {
            throw new ServiceUnavailableAppError('Failed to change user role');
        }
    }

    async deleteUser(id: string): Promise<Boolean> {
        const user = await this.prismaService.user.findFirst({
            where: {
                id
            }
        })

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        try {
            await this.prismaService.user.delete({
                where: {
                    id
                }
            })
            return true;
        } catch {
            throw new ServiceUnavailableAppError('Failed to delete user');
        }
    }

    async updateUser(id: string, data: UpdateUserInput): Promise<UserEntity> {
        const user = await this.prismaService.user.findFirst({
            where: {
                id
            }
        })

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        try {
            const updatedUser = await this.prismaService.user.update({
                where: {
                    id
                },
                data
            })
            return this.toUserEntity(updatedUser);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictAppError('Email already exists');
            }
            throw new ServiceUnavailableAppError('Failed to update user');
        }
    }

    private toUserEntity(user: UserEntity): UserEntity {
        return {
            id: user.id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            isActive: user.isActive,
            // permissions: getPermissionsByRole(user.role),
        };
    }
}