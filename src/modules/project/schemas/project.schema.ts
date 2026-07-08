import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { ProjectStatus } from '../enums/project-status.enum';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true, default: 'New Project', trim: true })
    title!: string;

    @Prop({ trim: true, nullable: true })
    description?: string;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    authorId!: Types.ObjectId;

    @Prop({
        type: String,
        enum: ProjectStatus,
        default: ProjectStatus.DRAFT,
        index: true,
    })
    status!: ProjectStatus;

    @Prop({ type: Date, default: null, index: true })
    publishedAt?: Date | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ status: 1, publishedAt: -1 });
ProjectSchema.index({ authorId: 1, createdAt: -1 });
ProjectSchema.index({ authorId: 1, status: 1, updatedAt: -1 });
ProjectSchema.index({ title: 'text', description: 'text' });