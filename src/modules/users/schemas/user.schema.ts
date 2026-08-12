import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from 'src/generated/prisma/enums';
import { Permission } from '../../auth/enums/permissions.enum';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(Permission, {
    name: 'Permission',
})

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email!: string;

    @Prop({ required: true, select: false })
    passwordHash!: string;

    @Prop({ required: false, trim: true })
    firstName?: string;

    @Prop({ required: false, trim: true })
    lastName?: string;

    @Prop({ required: true, type: String, enum: Object.values(UserRole), default: UserRole.READER })
    role!: UserRole;

    @Prop({ default: false })
    isEmailVerified!: boolean;

    //   @Prop({ required: false })
    //   lastLoginAt?: Date;
    createdAt!: Date;
    updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);