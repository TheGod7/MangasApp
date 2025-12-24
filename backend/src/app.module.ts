import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infra/database/database.module';
import { MediaModule } from './infra/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    MediaModule,
  ],
})
export class AppModule {}
