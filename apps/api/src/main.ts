import "reflect-metadata";

import { resolveServicePort } from "@rolecraft/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true
  });

  const port = resolveServicePort(process.env, 3001);
  await app.listen(port);
}

bootstrap();
