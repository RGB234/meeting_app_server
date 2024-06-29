import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

// app.module.ts is in .gitignore due to security issues

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '',
      port: 0,
      username: '',
      password: '',
      database: '',
      entities: [],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
