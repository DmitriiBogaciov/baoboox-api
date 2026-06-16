import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';


@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;

    constructor(private readonly configService: ConfigService) {
        this.client = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
            password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
            db: this.configService.get<number>('REDIS_DB') ?? 0,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
        });
    }

    async onModuleInit(): Promise<void> {
        await this.client.connect();
        await this.client.ping();
        this.logger.log('Redis connected');
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }

    getClient(): Redis {
        return this.client;
    }
}