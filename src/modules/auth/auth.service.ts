import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import ms, { StringValue } from 'ms';
import { UserRole } from '../users/enums/user-role.enum';
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
import {
    Auth_Session,
    AuthSessionDocument,
} from './schemas/auth-session.schema';

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
    ) { }

    async register(
        input: RegisterInput,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const email = input.email.toLowerCase().trim();

        const existingUser = await this.userModel.findOne({ email }).exec();

        if (existingUser) {
            throw new ConflictAppError('Email already in use');
        }

        const passwordHash = await this.passwordService.hash(input.password);

        const user = await this.userModel.create({
            firstName: input.firstName?.trim(),
            email,
            passwordHash,
            role: UserRole.READER,
        });

        return this.issueTokens(user, meta);
    }

    async login(
        input: LoginInput,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const email = input.email.toLowerCase().trim();

        const user = await this.userModel
            .findOne({ email })
            .select('+passwordHash')
            .exec();

        if (!user || !user.passwordHash) {
            throw new UnauthorizedAppError('Invalid email or password');
        }

        const isPasswordValid = await this.passwordService.compare(
            input.password,
            user.passwordHash,
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

        const session = await this.authSessionModel
            .findById(payload.sessionId)
            .select('+refreshTokenHash')
            .exec();

        if (!session || session.isRevoked || session.expiresAt <= new Date()) {
            throw new UnauthorizedAppError('Refresh session is invalid');
        }

        const isValid = await this.passwordService.compare(
            refreshToken,
            session.refreshTokenHash,
        );

        if (!isValid) {
            session.isRevoked = true;
            await session.save();
            
            throw new UnauthorizedAppError('Refresh token reuse detected');
        }

        session.isRevoked = true;
        await session.save();

        const user = await this.userModel.findById(payload.sub).exec();

        if (!user) {
            throw new UnauthorizedAppError('User not found');
        }

        return this.issueTokens(user, {
            ip: meta?.ip ?? session.ip ?? undefined,
            userAgent: meta?.userAgent ?? session.userAgent ?? undefined,
        });
    }

    async logout(refreshToken: string): Promise<boolean> {
        try {
            const payload = await this.verifyRefreshToken(refreshToken);

            const session = await this.authSessionModel
                .findById(payload.sessionId)
                .exec();

            if (!session) {
                return true;
            }

            session.isRevoked = true;
            await session.save();

            return true;
        } catch {
            return true;
        }
    }

    async logoutAll(userId: string): Promise<boolean> {
        await this.authSessionModel.updateMany(
            {
                userId: new Types.ObjectId(userId),
                isRevoked: false,
            },
            {
                $set: {
                    isRevoked: true,
                },
            },
        );

        return true;
    }

    async getMySessions(userId: string): Promise<AuthSessionEntity[]> {
        const sessions = await this.authSessionModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();

        return sessions.map((session) => this.toAuthSessionEntity(session));
    }

    async revokeSession(userId: string, sessionId: string): Promise<boolean> {
        const session = await this.authSessionModel.findOne({
            _id: new Types.ObjectId(sessionId),
            userId: new Types.ObjectId(userId),
        });

        if (!session) {
            throw new NotFoundAppError('Session not found');
        }

        if (session.isRevoked) {
            return true;
        }

        session.isRevoked = true;
        await session.save();

        return true;
    }

    private async issueTokens(
        user: UserDocument,
        meta?: SessionMeta,
    ): Promise<AuthResponseEntity> {
        const session = new this.authSessionModel({
            userId: user._id,
            refreshTokenHash: 'temp',
            isRevoked: false,
            expiresAt: this.getRefreshTokenExpiryDate(),
            lastUsedAt: new Date(),
            userAgent: meta?.userAgent ?? null,
            ip: meta?.ip ?? null,
        });

        await session.save();

        const permissions = getPermissionsByRole(user.role);

        const accessToken = await this.jwtService.signAsync<AccessPayload>(
            {
                sub: user._id.toString(),
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
                sub: user._id.toString(),
                sessionId: session._id.toString(),
                type: 'refresh',
            },
            {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: (
                    this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d'
                ) as StringValue,
            },
        );

        session.refreshTokenHash = await this.passwordService.hash(refreshToken);
        session.lastUsedAt = new Date();
        await session.save();

        return {
            accessToken,
            refreshToken,
            user: this.toUserEntity(user),
        };
    }

    private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
        try {
            console.log('Verifying refresh token:', token);
            const payload = await this.jwtService.verifyAsync<RefreshPayload>(token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });

            if (payload.type !== 'refresh') {
                console.error('Invalid token type:', payload.type);
                throw new UnauthorizedAppError('Invalid refresh token');
            }
            console.log('Refresh token verified successfully:', payload);
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

    private toUserEntity(user: UserDocument): UserEntity {
        return {
            id: user._id.toString(),
            firstName: user.firstName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            // permissions: getPermissionsByRole(user.role),
        };
    }

    private toAuthSessionEntity(session: AuthSessionDocument): AuthSessionEntity {
        return {
            id: session._id.toString(),
            userId: session.userId.toString(),
            userAgent: session.userAgent ?? undefined,
            ip: session.ip ?? undefined,
            isRevoked: session.isRevoked ?? false,
            createdAt: (session as any).createdAt,
            expiresAt: session.expiresAt,
            lastUsedAt: session.lastUsedAt ?? undefined,
        };
    }
}