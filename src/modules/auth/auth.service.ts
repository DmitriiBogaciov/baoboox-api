import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ConflictAppError, UnauthorizedAppError } from '../../common/errors';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponseEntity } from './entities/auth-response.entity';
import { PasswordService } from './password.service';
import {
    AuthSession,
    AuthSessionDocument,
} from './schemas/auth-session.schema';

type AccessPayload = {
    sub: string;
    email: string;
};

type RefreshPayload = {
    sub: string;
    sessionId: string;
    type: 'refresh';
};

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        @InjectModel(AuthSession.name)
        private readonly authSessionModel: Model<AuthSessionDocument>,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(input: RegisterInput): Promise<AuthResponseEntity> {
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
        });

        return this.issueTokens(user);
    }

    async login(input: LoginInput): Promise<AuthResponseEntity> {
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

        return this.issueTokens(user);
    }

    async refresh(refreshToken: string): Promise<AuthResponseEntity> {
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

        return this.issueTokens(user);
    }

    async logout(refreshToken: string): Promise<boolean> {
        try {
            const payload = await this.verifyRefreshToken(refreshToken);

            const session = await this.authSessionModel.findById(payload.sessionId).exec();

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

    private async issueTokens(user: UserDocument): Promise<AuthResponseEntity> {
        const refreshExpiresIn = Number(
            this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
        );

        const session = await this.authSessionModel.create({
            userId: new Types.ObjectId(user._id),
            refreshTokenHash: 'temp',
            expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
            isRevoked: false,
        });

        const accessToken = await this.jwtService.signAsync(
            {
                sub: user._id.toString(),
                email: user.email,
            } satisfies AccessPayload,
            {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: Number(
                    this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
                ),
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            {
                sub: user._id.toString(),
                sessionId: session.id,
                type: 'refresh',
            } satisfies RefreshPayload,
            {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            },
        );

        session.refreshTokenHash = await this.passwordService.hash(refreshToken);
        await session.save();

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
        } catch {
            throw new UnauthorizedAppError('Invalid refresh token');
        }
    }


    private toUserEntity(user: UserDocument): UserEntity {
        return {
            id: user._id.toString(),
            firstName: user.firstName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}