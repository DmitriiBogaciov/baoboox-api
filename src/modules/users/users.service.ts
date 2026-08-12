import { Injectable } from '@nestjs/common';
import { ChangeUserRoleInput, UserQueryInput, UsersResponse } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import {
    ConflictAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';
import { UserEntity } from './entities/user.entity';
import { SortDirection, UserSortField } from './enums';
import { UserSortFieldMap } from './enum-maps/user-sort-field.map';
import { SortDirectionMap } from './enum-maps/sort-direction.map';

@Injectable()
export class UsersService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    // async findAll(): Promise<UserEntity[]> {
    //     try {
    //         return await this.prismaService.user.findMany({
    //             orderBy: {
    //                 email: 'asc',
    //             }
    //         })
    //     } catch {
    //         throw new ServiceUnavailableAppError('Failed to load users');
    //     }
    // }

    async findAll(query?: UserQueryInput): Promise<UsersResponse>  {
        const page = query?.pagination?.page ?? 1;
        const limit = query?.pagination?.limit ?? 20;

        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {}

        if (query?.filter?.search) {
            where.OR = [
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

        const sortField = UserSortFieldMap[query?.sort?.field ?? UserSortField.CREATED_AT];

        const sortDirection = SortDirectionMap[query?.sort?.direction ?? SortDirection.DESC];

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

    // async findById(id: string): Promise<UserDocument> {
    //     const user = await this.userModel.findById(id).exec();

    //     if (!user) {
    //         throw new NotFoundAppError('User not found');
    //     }

    //     return user;
    // }

    // async changeUserRole(input: ChangeUserRoleInput): Promise<UserDocument> {
    //     const user = await this.userModel.findById(input.userId).exec();

    //     if (!user) {
    //         throw new NotFoundAppError('User not found');
    //     }

    //     user.role = input.newRole;

    //     try {
    //         return await user.save();
    //     } catch {
    //         throw new ServiceUnavailableAppError('Failed to change user role');
    //     }
    // }

    // async deleteUser(id: string): Promise<Boolean> {
    //     const user = await this.userModel.findById(id).exec();

    //     if (!user) {
    //         throw new NotFoundAppError('User not found');
    //     }

    //     try {
    //         const result = await user.deleteOne();
    //         if (result.deletedCount === 0) {
    //             throw new ServiceUnavailableAppError('Failed to delete user');
    //         }
    //         return true;
    //     } catch {
    //         throw new ServiceUnavailableAppError('Failed to delete user');
    //     }
    // }
    private toUserEntity(user: UserEntity): UserEntity {
        return {
            id: user.id.toString(),
            firstName: user.firstName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            isActive: user.isActive,
            // permissions: getPermissionsByRole(user.role),
        };
    }
}