import { config } from 'dotenv';
import { Knex } from 'knex';
import path from 'path';

config();

const basePath = path.resolve(__dirname, 'src/modules/database');

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: process.env.DATABASE_DIALECT,
    connection: {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    },
    migrations: {
      directory: path.join(basePath, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(basePath, 'seeds'),
      extension: 'ts',
    },
  },
};

export default knexConfig;
