import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable Cross-Origin Resource Sharing
  app.enableCors({
    origin: '*', // for development flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Serve static files from the uploads directory
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
