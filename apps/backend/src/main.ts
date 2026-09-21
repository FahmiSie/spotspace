import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
    : [];
  const allowedOrigins = Array.from(
    new Set(['http://localhost:3000', 'http://localhost:3001', ...envOrigins]),
  );

  app.enableCors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin ? origin.replace(/\/$/, '') : '';
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked by SpotSpace security policy: ${origin}`));
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));
  app.use('/api/uploads', express.static(uploadsPath));

  const config = new DocumentBuilder()
    .setTitle('SpotSpace API')
    .setDescription('API documentation for SpotSpace Reservation System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
