import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserInput } from './dto/create-user.input';
import { User, UserDocument } from './schemas/user.schema';
import {
    ConflictAppError,
    NotFoundAppError,
    ServiceUnavailableAppError,
} from '../../common/errors';

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
}