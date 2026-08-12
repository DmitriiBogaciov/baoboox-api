import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import ms, { StringValue } from 'ms';
import { UserRole } from '../../generated/prisma/enums';
import { Permission } from './enums/permissions.enum';
import { getPermissionsByRole } from './utils/get-permissions-by-role.util';
import { ConflictAppError, UnauthorizedAppError, NotFoundAppError } from '../../common/errors';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponseEntity } from './entities/auth-response.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { PasswordService } from './password.service';
import { PrismaService } from '../prisma/prisma.service'
import { createId } from '@paralleldrive/cuid2';
import {
    Auth_Session,
    AuthSessionDocument,
} from './schemas/auth-session.schema';
import { Prisma } from 'src/generated/prisma/client';

type AccessPayload = {
    sub: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
};

type RefreshPayload = {
    sub: string;
    sessionId: string;
    type: 'refresh';
};

export interface SessionMeta {
    ip?: string;
    userAgent?: string;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(Auth_Session.name)
        private readonly authSessionModel: Model<AuthSessionDocument>,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) { }

    async register(
        input: RegisterInput,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const email = input.email.toLowerCase().trim();

        const existingUser = await this.prismaService.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictAppError('Email already in use');
        }

        const passwordHash = await this.passwordService.hash(input.password);

        const createdUser = await this.prismaService.user.create({
            data: {
                firstName: input.firstName?.trim(),
                email,
                password: passwordHash,
            },
        });

        return this.issueTokens(createdUser, meta);
    }



    async login(
        input: LoginInput,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const email = input.email.toLowerCase().trim();

        const user = await this.prismaService.user.findUnique({
            where: {
                email
            }
        })

        if (!user || !user.password) {
            throw new UnauthorizedAppError('Invalid email or password');
        }

        const isPasswordValid = await this.passwordService.compare(
            input.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedAppError('Invalid email or password');
        }

        return this.issueTokens(user, meta);
    }

    async refresh(
        refreshToken: string,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const payload = await this.verifyRefreshToken(refreshToken);

        return this.prismaService.$transaction(async (tx) => {
            const session = await tx.authSession.findUnique({
                where: {
                    id: payload.sessionId,
                },
            });

            if (
                !session ||
                session.isRevoked ||
                session.expiresAt.getTime() <= Date.now()
            ) {
                throw new UnauthorizedAppError('Refresh session is invalid');
            }

            const isValid = await this.passwordService.compare(
                refreshToken,
                session.refreshTokenHash,
            );

            if (!isValid) {
                await tx.authSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        isRevoked: true,
                    },
                });

                throw new UnauthorizedAppError('Refresh token reuse detected');
            }

            const user = await tx.user.findUnique({
                where: {
                    id: session.userId,
                },
            });

            if (!user || !user.isActive) {
                await tx.authSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        isRevoked: true,
                    },
                });

                throw new UnauthorizedAppError('User not found');
            }

            await tx.authSession.update({
                where: {
                    id: session.id,
                },
                data: {
                    isRevoked: true,
                    lastUsedAt: new Date(),
                },
            });

            return this.issueTokens(
                user,
                {
                    ip: meta?.ip ?? session.ip ?? undefined,
                    userAgent: meta?.userAgent ?? session.userAgent ?? undefined,
                },
                tx
            );
        });
    }

    async logout(refreshToken: string): Promise<boolean> {
        try {
            const payload = await this.verifyRefreshToken(refreshToken);

            return this.prismaService.$transaction(async (tx) => {
                const session = await tx.authSession.findUnique({
                    where: {
                        id: payload.sessionId,
                    }
                })

                if (
                    !session ||
                    session.isRevoked ||
                    session.expiresAt.getTime() <= Date.now()
                ) {
                    return true;
                }

                await tx.authSession.update({
                    where: { id: session.id },
                    data: { isRevoked: true },
                });

                return true;
            })
        } catch {
            return true;
        }
    }

    async logoutAll(userId: string): Promise<number> {
        const result = await this.prismaService.authSession.updateMany({
            where: {
                userId,
                isRevoked: false
            },
            data: {
                isRevoked: true,
            }
        })

        return result.count;
    }

    async getMySessions(userId: string): Promise<AuthSessionEntity[]> {
        const sessions = await this.prismaService.authSession.findMany({
            where: {
                userId,
                isRevoked: false
            },
        })

        return sessions.map((session) => this.toAuthSessionEntity(session));
    }

    async revokeSession(userId: string, id: string): Promise<boolean> {
        const session = await this.prismaService.authSession.update({
            where: {
                id,
                userId
            },
            data: {
                isRevoked: true
            }
        })

        if (!session) {
            throw new NotFoundAppError('Session not found');
        }

        if (session.isRevoked) {
            return true;
        }

        return true;
    }

    async deleteExpiredSessions(): Promise<number>{
        const result = await this.prismaService.authSession.deleteMany({
            where: {
                isRevoked: true,
            }
        })
        return result.count;
    }

    private async issueTokens(
        user: UserEntity,
        meta?: SessionMeta,
        prisma: PrismaService | Prisma.TransactionClient = this.prismaService,
    ): Promise<AuthResponseEntity> {

        const sessionId = createId();

        const permissions = getPermissionsByRole(user.role);

        const accessToken = await this.jwtService.signAsync<AccessPayload>(
            {
                sub: user.id.toString(),
                email: user.email,
                role: user.role,
                permissions: permissions,
            },
            {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: (
                    this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m'
                ) as StringValue,
            },
        );

        const refreshToken = await this.jwtService.signAsync<RefreshPayload>(
            {
                sub: user.id.toString(),
                sessionId,
                type: 'refresh',
            },
            {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: (
                    this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d'
                ) as StringValue,
            },
        );

        const refreshTokenHash = await this.passwordService.hash(refreshToken);

        await prisma.authSession.create({
            data: {
                id: sessionId,
                userId: user.id,
                refreshTokenHash,
                isRevoked: false,
                expiresAt: this.getRefreshTokenExpiryDate(),
                lastUsedAt: new Date(),
                userAgent: meta?.userAgent,
                ip: meta?.ip
            }
        })

        return {
            accessToken,
            refreshToken,
            user: this.toUserEntity(user),
        };
    }

    private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
        try {
            const payload = await this.jwtService.verifyAsync<RefreshPayload>(token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });

            if (payload.type !== 'refresh') {
                throw new UnauthorizedAppError('Invalid refresh token');
            }
            return payload;
        } catch (error) {
            console.error('Error verifying refresh token:', error);
            throw new UnauthorizedAppError('Invalid refresh token');
        }
    }

    private getRefreshTokenExpiryDate(): Date {
        const refreshExpiresIn =
            this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

        const ttl = ms(refreshExpiresIn as StringValue);

        if (typeof ttl !== 'number') {
            throw new Error('Invalid JWT_REFRESH_EXPIRES_IN value');
        }

        return new Date(Date.now() + ttl);
    }

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

    private toAuthSessionEntity(session: AuthSessionEntity): AuthSessionEntity {
        return {
            id: session.id,
            userId: session.userId,
            userAgent: session.userAgent ?? null,
            ip: session.ip ?? null,
            isRevoked: session.isRevoked ?? false,
            createdAt: (session as any).createdAt,
            expiresAt: session.expiresAt,
            lastUsedAt: session.lastUsedAt ?? null,
        };
    }
}