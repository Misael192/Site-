import "reflect-metadata";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { ProblemDetailsFilter } from "./core/http/problem-details.filter";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  // Segurança de borda (doc 05 §3)
  app.use(helmet());
  app.enableCors({ origin: env.corsOrigins, credentials: true });

  // API versionada desde o nascimento: /api/v1/... (doc 12 §1)
  app.setGlobalPrefix("api", { exclude: ["health/live", "health/ready"] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // Validação de entrada: whitelist estrita (doc 05 §3)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  // OpenAPI gerado do código — contrato vivo (doc 12 §2)
  const openApiConfig = new DocumentBuilder()
    .setTitle("PeopleFlow API")
    .setDescription("Plataforma HCM multi-tenant — Core + Modules")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(env.port);
  // eslint-disable-next-line no-console
  console.log(`PeopleFlow API: http://localhost:${env.port}/api/docs`);
}

void bootstrap();
