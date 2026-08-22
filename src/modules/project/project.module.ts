import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }])],
  providers: [ProjectService, ProjectResolver, PrismaService],
  exports: [ProjectService]
})
export class ProjectModule {}
