import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import UsersResolver from './users.resolver';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersResolver, 
    UsersService, 
    PrismaService],
  exports: [UsersService],
})
export class UsersModule {}