import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserInput, ChangeUserRoleInput } from './dto';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from './enums/user-role.enum';
import {
    ConflictAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';
import { BooleanSchemaDefinition } from 'mongoose';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    async create(createUserInput: CreateUserInput): Promise<UserDocument> {
        const existingUser = await this.userModel
            .findOne({ email: createUserInput.email.toLowerCase() })
            .exec();

        if (existingUser) {
            throw new ConflictAppError('Email already in use');
        }

        try {
            const user = new this.userModel({
                ...createUserInput,
                email: createUserInput.email.toLowerCase(),
                role: UserRole.READER
            });

            return await user.save();
        } catch {
            throw new ServiceUnavailableAppError('Failed to create user');
        }
    }

    async findAll(): Promise<UserDocument[]> {
        try {
            return await this.userModel.find().sort({ createdAt: -1 }).exec();
        } catch {
            throw new ServiceUnavailableAppError('Failed to load users');
        }
    }

    async findById(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id).exec();

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        return user;
    }

    async changeUserRole(input: ChangeUserRoleInput): Promise<UserDocument> {
        const user = await this.userModel.findById(input.userId).exec();

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        user.role = input.newRole;

        try {
            return await user.save();
        } catch {
            throw new ServiceUnavailableAppError('Failed to change user role');
        }
    }

    async deleteUser(id: string): Promise<Boolean> {
        const user = await this.userModel.findById(id).exec();

        if (!user) {
            throw new NotFoundAppError('User not found');
        }

        try {
            const result = await user.deleteOne();
            if (result.deletedCount === 0) {
                throw new ServiceUnavailableAppError('Failed to delete user');
            }
            return true;
        } catch {
            throw new ServiceUnavailableAppError('Failed to delete user');
        }
    }
}