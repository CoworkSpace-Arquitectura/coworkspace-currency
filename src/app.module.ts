import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CurrencyModule } from './currency/currency.module.js';

@Module({
  imports: [PrismaModule, CurrencyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
