import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private static knexInstance: Knex;

  constructor(private readonly configService: ConfigService) {
    if (!DatabaseService.knexInstance) {
      DatabaseService.knexInstance = knex({
        client: this.configService.get<string>('DATABASE_DIALECT'),
        connection: {
          host: this.configService.get<string>('DATABASE_HOST'),
          port: this.configService.get<number>('DATABASE_PORT'),
          user: this.configService.get<string>('DATABASE_USER'),
          password: this.configService.get<string>('DATABASE_PASSWORD'),
          database: this.configService.get<string>('DATABASE_NAME'),
        },
        pool: {
          min: 1,
          max: 10,
        },
      });
    }
  }

  get db(): Knex {
    return DatabaseService.knexInstance;
  }

  async onModuleInit() {
    console.log('Knex connection initialized');
  }

  async onModuleDestroy() {
    if (DatabaseService.knexInstance) {
      await DatabaseService.knexInstance.destroy();
      console.log('Knex connection destroyed');
    }
  }
}
