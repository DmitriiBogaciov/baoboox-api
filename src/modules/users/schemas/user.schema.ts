import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Роли можно вынести в отдельный enum в папке common/enums
export enum Role {
    USER = 'user',
    ADMIN = 'admin',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email!: string;

    @Prop({ required: true, select: false })
    passwordHash!: string;

    @Prop({ required: false, trim: true })
    firstName?: string;

    //   @Prop({ required: false, trim: true })
    //   lastName?: string;

    //   @Prop({ type: [String], enum: Role, default: [Role.USER] })
    //   roles!: Role[];

    //   @Prop({ default: false })
    //   isEmailVerified!: boolean;

    //   @Prop({ required: false })
    //   lastLoginAt?: Date;
    createdAt!: Date;
    updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);