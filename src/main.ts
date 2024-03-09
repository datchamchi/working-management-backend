import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory(errors) {
          const errMess = [];
          errors.forEach((error) =>
            errMess.push(error.constraints[Object.keys(error.constraints)[0]]),
          );
          return new BadRequestException(errMess);
        },
      }),
    );
  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, () => {
    console.log(`Server starting at ${PORT} mode: ${process.env.NODE_ENV}`);
  });
}
bootstrap();
