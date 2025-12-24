import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig = registerAs(
  'database',
  (): MongooseModuleOptions => ({
    dbName: process.env.MONGO_DB_NAME,
    uri: process.env.MONGO_URI,
  }),
);
