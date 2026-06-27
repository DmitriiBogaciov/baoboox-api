import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AuthSessionDocument = HydratedDocument<Auth_Session>;

@Schema({ timestamps: true })
export class Auth_Session {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    userId!: Types.ObjectId;

    @Prop({ required: true, select: false })
    refreshTokenHash!: string;

    @Prop({ default: false, required: true, index: true })
    isRevoked!: boolean;

    @Prop({ type: Date, required: true, index: true })
    expiresAt!: Date;

    @Prop({ type: Date, default: null })
    lastUsedAt?: Date | null;

    @Prop({ type: String, default: null })
    userAgent?: string | null;

    @Prop({ type: String, default: null })
    ip?: string | null;

    createdAt!: Date;
    updatedAt!: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(Auth_Session);