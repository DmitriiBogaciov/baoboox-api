import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { Request, Response } from 'express';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './core/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import * as Joi from 'joi';
import { ErrorsModule } from './common/errors/errors.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        MONGODB_URI: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        REDIS_DB: Joi.number().default(0),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
      })
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not defined in the environment variables');
        }
        return { uri };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: async (configService: ConfigService) => ({
        context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        graphiql: configService.get('NODE_ENV') !== 'production',
        subscriptions: {
          'graphql-ws': true,
        },
        formatError: (formattedError) => ({
          message: formattedError.message,
          code:
            formattedError.extensions?.code ??
            'INTERNAL_SERVER_ERROR',
          details: formattedError.extensions?.details,
          path: formattedError.path,
        }),
      })
    }),
    RedisModule,
    HealthModule,
    UsersModule,
    ErrorsModule,
    AuthModule,
    ProjectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
